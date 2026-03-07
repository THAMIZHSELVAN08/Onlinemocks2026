// src/routes/volunteer.ts
import express from "express";
import bcrypt from "bcryptjs";
import { registry } from "../openapi";
import { auth, checkRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  AddStudentSchema,
  VolunteerStudentResponseSchema,
  CancelAssignmentParamSchema,
  CancelAssignmentResponseSchema,
  CancelAssignmentParam,
} from "../schemas";
import prisma from "../lib/prisma";
const router = express.Router();
import z from "zod";
// ── GET /stats ───────────────────────────────────────────────────────────────
router.get("/stats", auth, checkRole(["VOLUNTEER"]), async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { id: req.user.id },
      select: { assignedHrId: true },
    });

    if (!volunteer?.assignedHrId) {
      return res.json({ studentsEvaluated: 0, totalEnrolled: 0 });
    }

    const [studentsEvaluated, total] = await Promise.all([
      prisma.evaluation.count({
        where: { hrId: volunteer.assignedHrId },
      }),
      prisma.hrAssignment.count({
        where: {
          hrId: volunteer.assignedHrId,
          status: { not: "CANCELLED" },
        },
      }),
    ]);

    res.json({ studentsEvaluated, totalEnrolled: total });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// ── GET /hr-info ──────────────────────────────────────────────────────────────
router.get("/hr-info", auth, checkRole(["VOLUNTEER"]), async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { id: req.user.id },
      include: {
        assignedHr: {
          select: { name: true, companyName: true },
        },
      },
    });

    if (!volunteer?.assignedHr) {
      return res.json({ hrName: null, companyName: null });
    }

    res.json({
      hrName: volunteer.assignedHr.name ?? null,
      companyName: volunteer.assignedHr.companyName ?? null,
    });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});



router.get("/students", auth, checkRole(["VOLUNTEER"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { id: req.user.id },
      select: { assignedHrId: true },
    });

    if (!volunteer?.assignedHrId) {
      return res
        .status(403)
        .json({ message: "No HR assigned to this volunteer" });
    }

    const assignments = await prisma.hrAssignment.findMany({
      where: { hrId: volunteer.assignedHrId },
      include: {
        student: {
          include: {
            evaluations: {
              where: { hrId: volunteer.assignedHrId },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    const result = assignments.map((a) => ({
      assignmentId: a.id,
      order: a.order,
      status: a.status,
      ...a.student,
      register_number: a.student.registerNumber,
      evaluation_status:
        a.student.evaluations.length > 0 ? "COMPLETED" : "INCOMPLETE",
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
// ── POST /student ─────────────────────────────────────────────────────────────

router.post(
  "/enroll",
  auth,
  checkRole(["VOLUNTEER"]),
  validate(AddStudentSchema),
  async (req, res) => {
    const { name, register_number, department, section, resume_url } = req.body;

    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const volunteer = await prisma.volunteerProfile.findUnique({
        where: { id: req.user.id },
        select: { assignedHrId: true },
      });

      if (!volunteer?.assignedHrId) {
        return res
          .status(403)
          .json({ message: "No HR assigned to this volunteer" });
      }

      // 1️⃣ Find or create student
      let student = await prisma.student.findUnique({
        where: { registerNumber: register_number },
      });

      if (!student) {
        student = await prisma.student.create({
          data: {
            name,
            registerNumber: register_number,
            department,
            section,
            resumeUrl: resume_url,
          },
        });
      }

      // 2️⃣ Check existing assignment anywhere
      const existingAssignment = await prisma.hrAssignment.findFirst({
        where: { studentId: student.id },
      });

      if (existingAssignment) {
        // If already assigned to same HR
        if (existingAssignment.hrId === volunteer.assignedHrId) {
          return res.status(400).json({
            message: "Student already assigned to your HR",
          });
        }

        // If status NOT cancelled → block transfer
        if (existingAssignment.status !== "CANCELLED") {
          return res.status(400).json({
            message:
              "Student is currently active under another HR. They must be cancelled before reallocation.",
          });
        }

        // If cancelled → transfer
        const lastAssignment = await prisma.hrAssignment.findFirst({
          where: { hrId: volunteer.assignedHrId },
          orderBy: { order: "desc" },
        });

        const nextOrder = lastAssignment ? lastAssignment.order + 1 : 1;

        await prisma.hrAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            hrId: volunteer.assignedHrId,
            order: nextOrder,
            status: "PENDING",
          },
        });

        return res.json({ message: "Student transferred successfully" });
      }

      // 3️⃣ No assignment exists → normal assignment
      const lastAssignment = await prisma.hrAssignment.findFirst({
        where: { hrId: volunteer.assignedHrId },
        orderBy: { order: "desc" },
      });

      const nextOrder = lastAssignment ? lastAssignment.order + 1 : 1;

      await prisma.hrAssignment.create({
        data: {
          hrId: volunteer.assignedHrId,
          studentId: student.id,
          order: nextOrder,
        },
      });

      res.json({ message: "Student assigned successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

router.patch(
  "/cancel/:assignmentId",
  auth,
  checkRole(["VOLUNTEER"]),
  validate(CancelAssignmentParamSchema, "params"),
  async (req, res) => {
    const parsed = CancelAssignmentParamSchema.parse(req.params);
    const { assignmentId } = parsed;
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const volunteer = await prisma.volunteerProfile.findUnique({
        where: { id: req.user.id },
        select: { assignedHrId: true },
      });

      if (!volunteer?.assignedHrId) {
        return res.status(403).json({
          message: "No HR assigned to this volunteer",
        });
      }

      const assignment = await prisma.hrAssignment.findUnique({
        where: { id: assignmentId },
      });

      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found",
        });
      }

      if (assignment.hrId !== volunteer.assignedHrId) {
        return res.status(403).json({
          message: "Not authorized to cancel this assignment",
        });
      }

      await prisma.hrAssignment.update({
        where: { id: assignmentId },
        data: { status: "CANCELLED" },
      });

      res.json({ message: "Student deallocated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);
//Create a feature for changing order of students
// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
router.get("/notifications", auth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const notifications = await prisma.notification.findMany({
      where: { receiverId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

router.patch("/notifications/:id/read", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") return res.status(400).json({ message: "Invalid ID" });
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

router.post("/notifications/read-all", auth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    await prisma.notification.updateMany({
      where: { receiverId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: "All marked as read" });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

router.delete("/notifications/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") return res.status(400).json({ message: "Invalid ID" });
    await prisma.notification.delete({
      where: { id },
    });
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});


// ── POST /feedback ──────────────────────────────────────────────────────────
const VolunteerFeedbackSchema = z.object({
  clarityOfInstructions: z.number().int().min(1).max(10),
  hrCooperation: z.number().int().min(1).max(10),
  organizationOfSchedule: z.number().int().min(1).max(10),
  softwareEase: z.number().int().min(1).max(10),
  workloadManagement: z.number().int().min(1).max(10),
  overallExperience: z.number().int().min(1).max(10),
  issuesFaced: z.string().optional(),
  improvementSuggestions: z.string().optional(),
  additionalComments: z.string().optional(),
});

router.post("/feedback", auth, checkRole(["VOLUNTEER"]), async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const parsed = VolunteerFeedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid feedback data", errors: parsed.error.errors });
    }

    const {
      clarityOfInstructions,
      hrCooperation,
      organizationOfSchedule,
      softwareEase,
      workloadManagement,
      overallExperience,
      issuesFaced,
      improvementSuggestions,
      additionalComments,
    } = parsed.data;

    await prisma.volunteerFeedback.create({
      data: {
        volunteerId: req.user.id,
        clarityOfInstructions,
        hrCooperation,
        organizationOfSchedule,
        softwareEase,
        workloadManagement,
        overallExperience,
        issuesFaced,
        improvementSuggestions,
        additionalComments,
      },
    });

    res.json({ message: "Feedback submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

export default router;

registry.registerPath({
  method: "get",
  path: "/api/volunteer/students",
  tags: ["Volunteer"],
  security: [{ bearerAuth: [] }],
  description:
    "Retrieve all students assigned to the volunteer's HR in interview order.",
  responses: {
    200: {
      description: "Students retrieved successfully",
      content: {
        "application/json": {
          schema: z.array(VolunteerStudentResponseSchema),
        },
      },
    },
    403: {
      description: "Volunteer has no HR assigned",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/volunteer/enroll",
  tags: ["Volunteer"],
  security: [{ bearerAuth: [] }],
  description: `
Assign a student to the volunteer's HR.

Behavior:
- If student does not exist → create and assign.
- If assigned to same HR → error.
- If assigned to another HR and NOT cancelled → error.
- If cancelled under another HR → transfer to volunteer's HR.
`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: AddStudentSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Students assigned successfully",
    },
    400: {
      description: "Student already assigned or active under another HR",
    },
    403: {
      description: "Volunteer has no HR assigned",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/volunteer/cancel/{assignmentId}",
  tags: ["Volunteer"],
  security: [{ bearerAuth: [] }],
  description: `
Cancel (deallocate) a student from the volunteer's assigned HR.

Business Rules:
- Volunteer must belong to an HR.
- Volunteer can only cancel assignments under their HR.
- Assignment status will be set to CANCELLED.
- Assignment record is NOT deleted (audit-safe).
- Once cancelled, student becomes eligible for reassignment.
`,
  request: {
    params: CancelAssignmentParamSchema,
  },
  responses: {
    200: {
      description: "Student successfully deallocated",
      content: {
        "application/json": {
          schema: CancelAssignmentResponseSchema,
        },
      },
    },
    403: {
      description:
        "Volunteer not assigned to HR or unauthorized to cancel this assignment",
    },
    404: {
      description: "Assignment not found",
    },
  },
});

//PUT /api/volunteer/reorder
//{
//  assignmentId: number,
//  newOrder: number
//}

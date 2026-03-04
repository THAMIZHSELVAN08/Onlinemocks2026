// src/routes/hr.ts
import express from "express";
import prisma from "../lib/prisma";
import { auth, checkRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  EvaluateStudentSchema,
  StudentIdParamSchema,
  AssignmentIdParamSchema,
  SubmitFeedbackSchema,
} from "../schemas";
import type { StudentIdParam } from "../schemas";
import { InterviewStatus } from "@prisma/client";
import { registry } from "../openapi";
import { AuthenticatedRequest } from "../types/authenticated-request";

const hrSecurity = [{ bearerAuth: [] }];
const router = express.Router();
// ── GET /stats ───────────────────────────────────────────────────────────────
router.get("/stats", auth, checkRole(["HR"]), async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const [total, completed, pending] = await Promise.all([
      prisma.hrAssignment.count({ where: { hrId: req.user.id } }),
      prisma.hrAssignment.count({
        where: { hrId: req.user.id, status: "COMPLETED" },
      }),
      prisma.hrAssignment.count({
        where: { hrId: req.user.id, status: "PENDING" },
      }),
    ]);

    res.json({ total, completed, pending });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// ── GET /students ────────────────────────────────────────────────────────────
router.get("/students", auth, checkRole(["HR"]), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user; // Now narrowed
    const assignments = await prisma.hrAssignment.findMany({
      where: { hrId: req.user.id },
      include: {
        student: {
          include: {
            evaluations: {
              where: { hrId: req.user.id },
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
// ── GET /student/:id ─────────────────────────────────────────────────────────

router.get(
  "/student/:id",
  auth,
  checkRole(["HR"]),
  validate(StudentIdParamSchema, "params"),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params as StudentIdParam;

      const assignment = await prisma.hrAssignment.findFirst({
        where: {
          studentId: id,
          hrId: req.user.id,
        },
        include: {
          student: true,
        },
      });

      if (!assignment) {
        return res.status(404).json({ message: "Student not assigned to you" });
      }

      res.json({
        ...assignment.student,
        register_number: assignment.student.registerNumber,
        assignmentId: assignment.id,
        order: assignment.order,
        status: assignment.status,
        current_date: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);
// ── POST /evaluate ───────────────────────────────────────────────────────────

router.post(
  "/evaluate",
  auth,
  checkRole(["HR"]),
  validate(EvaluateStudentSchema),
  async (req, res) => {
    const {
      studentId,
      criteria,
      strengths,
      improvements,
      comments,
      overallScore,
    } = req.body;

    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // ensure student is assigned to HR
      const assignment = await prisma.hrAssignment.findFirst({
        where: {
          studentId,
          hrId: req.user.id,
        },
      });

      if (!assignment) {
        return res.status(403).json({
          message: "You are not assigned to evaluate this student",
        });
      }

      await prisma.evaluation.upsert({
        where: {
          studentId_hrId: {
            studentId,
            hrId: req.user.id,
          },
        },
        create: {
          studentId,
          hrId: req.user.id,
          ...criteria,
          strengths,
          improvements,
          comments,
          overallScore,
        },
        update: {
          ...criteria,
          strengths,
          improvements,
          comments,
          overallScore,
          evaluationDate: new Date(),
        },
      });

      // mark assignment completed
      await prisma.hrAssignment.update({
        where: { id: assignment.id },
        data: { status: "COMPLETED" },
      });

      res.json({ message: "Evaluation submitted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

// --- when they dont show up , loop at end of queue--------
router.post(
  "/no-show/:assignmentId",
  auth,
  checkRole(["HR"]),
  async (req, res) => {
    const { assignmentId } = req.params;

    await prisma.hrAssignment.update({
      where: { id: Number(assignmentId) },
      data: { status: InterviewStatus.NO_SHOW },
    });

    res.json({ message: "Marked as no-show" });
  },
);

router.post(
  "/feedback",
  auth,
  checkRole(["HR"]),
  validate(SubmitFeedbackSchema),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const feedback = await prisma.feedback.create({
        data: {
          hrId: req.user.id,
          ...req.body,
        },
      });

      res.json({ message: "Feedback submitted successfully", feedback });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

export default router;

registry.registerPath({
  method: "get",
  path: "/api/hr/students",
  tags: ["HR"],
  security: hrSecurity,
  description:
    "Get all students assigned to the logged-in HR in interview order",
  responses: {
    200: {
      description: "Assigned students retrieved successfully",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/hr/student/{id}",
  tags: ["HR"],
  security: hrSecurity,
  description: "Get details of a specific assigned student",
  request: {
    params: StudentIdParamSchema,
  },
  responses: {
    200: {
      description: "Student details retrieved",
    },
    404: {
      description: "Student not assigned to this HR",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/hr/evaluate",
  tags: ["HR"],
  security: hrSecurity,
  description: "Submit or update evaluation for an assigned student",
  request: {
    body: {
      content: {
        "application/json": {
          schema: EvaluateStudentSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Evaluation submitted successfully",
    },
    403: {
      description: "Not authorized to evaluate this student",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/hr/no-show/{assignmentId}",
  tags: ["HR"],
  security: hrSecurity,
  description: "Mark a student as no-show for the given assignment",
  request: {
    params: AssignmentIdParamSchema,
  },
  responses: {
    200: {
      description: "Marked as no-show",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/hr/feedback",
  tags: ["HR"],
  security: [{ bearerAuth: [] }],
  description: "Submit feedback about recruitment experience",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SubmitFeedbackSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Feedback submitted successfully",
    },
  },
});

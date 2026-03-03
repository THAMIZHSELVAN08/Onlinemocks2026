// src/routes/pipeline.ts
import { registry } from "../openapi";
import { z } from "zod";
import express from "express";
import multer from "multer";
import path from "path";
import prisma from "../lib/prisma";
import { auth, checkRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { AddStudentSchema, StudentTransferSchema } from "../schemas";
import { InterviewStatus } from "@prisma/client";

const router = express.Router();
const pipelineSecurity = [{ bearerAuth: [] }];
// ─────────────────────────────────────────────
// Multer setup for resume upload
// ─────────────────────────────────────────────

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/resumes/"),
  filename: (_req, file, cb) => cb(null, file.originalname),
});

const uploadResume = multer({ storage: resumeStorage });

// ─────────────────────────────────────────────
// GET /students
// View all students in system
// ─────────────────────────────────────────────

router.get("/students", auth, checkRole(["PIPELINE"]), async (_req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        assignments: {
          include: {
            hr: {
              include: {
                hrProfile: true,
              },
            },
          },
        },
      },
      orderBy: { registerNumber: "asc" },
    });

    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ─────────────────────────────────────────────
// POST /student
// Add student to system
// ─────────────────────────────────────────────

router.post(
  "/student",
  auth,
  checkRole(["PIPELINE"]),
  validate(AddStudentSchema),
  async (req, res) => {
    const { name, registerNumber, department, section } = req.body;

    try {
      const existing = await prisma.student.findUnique({
        where: { registerNumber },
      });

      if (existing) {
        return res.status(400).json({
          message: "Student already exists",
        });
      }

      const student = await prisma.student.create({
        data: {
          name,
          registerNumber,
          department,
          section,
        },
      });

      res.json({
        message: "Student added successfully",
        student,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

// ─────────────────────────────────────────────
// POST /resume/:registerNumber
// Upload resume for student
// ─────────────────────────────────────────────

router.post(
  "/resume/:registerNumber",
  auth,
  checkRole(["PIPELINE"]),
  uploadResume.single("file"),
  async (req, res) => {
    const registerNumber = Array.isArray(req.params.registerNumber)
      ? req.params.registerNumber[0]
      : req.params.registerNumber;
    try {
      const student = await prisma.student.findUnique({
        where: { registerNumber },
      });

      if (!student) {
        return res.status(404).json({
          message: "Student not found",
        });
      }

      await prisma.student.update({
        where: { registerNumber },
        data: {
          resumeUrl: `/uploads/resumes/${req.file?.filename}`,
        },
      });

      res.json({
        message: "Resume uploaded successfully",
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

// ─────────────────────────────────────────────
// POST /transfer
// Assign student to HR (pipeline allocation)
// ─────────────────────────────────────────────

router.post(
  "/transfer",
  auth,
  checkRole(["PIPELINE"]),
  validate(StudentTransferSchema),
  async (req, res) => {
    const { studentIds, targetHrId, reason } = req.body;

    try {
      await prisma.$transaction(async (tx) => {
        for (const studentId of studentIds) {
          const existingAssignment = await tx.hrAssignment.findFirst({
            where: { studentId },
          });

          const lastAssignment = await tx.hrAssignment.findFirst({
            where: { hrId: targetHrId },
            orderBy: { order: "desc" },
          });

          const nextOrder = lastAssignment ? lastAssignment.order + 1 : 1;

          if (existingAssignment) {
            await tx.hrAssignment.update({
              where: { id: existingAssignment.id },
              data: {
                hrId: targetHrId,
                order: nextOrder,
                status: InterviewStatus.PENDING,
              },
            });
          } else {
            await tx.hrAssignment.create({
              data: {
                hrId: targetHrId,
                studentId,
                order: nextOrder,
              },
            });
          }

          await tx.studentTransfer.create({
            data: {
              studentId,
              toHrId: targetHrId,
              transferReason: reason,
            },
          });
        }
      });

      res.json({ message: "Students allocated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

export default router;

registry.registerPath({
  method: "get",
  path: "/api/pipeline/students",
  tags: ["Pipeline"],
  security: pipelineSecurity,
  description:
    "Retrieve all students in the system along with their HR assignments.",
  responses: {
    200: {
      description: "List of all students",
    },
    403: {
      description: "Access denied (PIPELINE role required)",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/pipeline/student",
  tags: ["Pipeline"],
  security: pipelineSecurity,
  description: `
Add a new student to the system.

Rules:
- registerNumber must be unique
- If student exists, request fails
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
      description: "Student created successfully",
    },
    400: {
      description: "Student already exists or validation failed",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/pipeline/resume/{registerNumber}",
  tags: ["Pipeline"],
  security: pipelineSecurity,
  description: `
Upload a resume for a student using register number.

Content-Type: multipart/form-data
Field name: file
`,
  request: {
    params: z.object({
      registerNumber: z.string(),
    }),
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              file: {
                type: "string",
                format: "binary",
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Resume uploaded successfully",
    },
    404: {
      description: "Student not found",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/pipeline/transfer",
  tags: ["Pipeline"],
  security: pipelineSecurity,
  description: `
Allocate or transfer students to a specific HR.

Behavior:
- If student has existing assignment → update it
- If no assignment → create one
- Transfer is logged in StudentTransfer table
`,
  request: {
    body: {
      content: {
        "application/json": {
          schema: StudentTransferSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Students allocated successfully",
    },
    400: {
      description: "Validation error",
    },
  },
});

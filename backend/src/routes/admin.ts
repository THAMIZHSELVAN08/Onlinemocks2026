// src/routes/admin.ts
import { InterviewStatus } from "@prisma/client";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import type { HrIdParam } from "../schemas";
import csv from "csv-parser";
import bcrypt from "bcryptjs";
import { auth, checkRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  AdminRegisterHrSchema,
  AdminRegisterVolunteerSchema,
  StudentTransferSchema,
  StudentSearchQuerySchema,
  HrIdParamSchema,
  CsvStudentRowSchema,
} from "../schemas";
import prisma from "../lib/prisma";
import crypto from "crypto";
const router = express.Router();
import { registry } from "../openapi";

// ── Multer configs ──────────────────────────────────────────────────────────

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/resumes/"),
  filename: (_req, file, cb) => cb(null, file.originalname),
});
const uploadResumes = multer({ storage: resumeStorage });
const uploadCsv = multer({ dest: "uploads/temp/" });

// ── GET /stats ───────────────────────────────────────────────────────────────

router.get("/stats", auth, checkRole(["ADMIN"]), async (_req, res) => {
  try {
    const [students, hrs, volunteers] = await Promise.all([
      prisma.student.count(),
      prisma.hrProfile.count(),
      prisma.volunteerProfile.count(),
    ]);
    res.json({ students, hrs, volunteers });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ── GET /students/all ────────────────────────────────────────────────────────

router.get("/students/all", auth, checkRole(["ADMIN"]), async (_req, res) => {
  try {
    const assignments = await prisma.hrAssignment.findMany({
      include: {
        student: {
          include: {
            evaluations: true,
          },
        },
        hr: {
          include: {
            hrProfile: { select: { name: true, companyName: true } },
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    const result = assignments.map((a) => ({
      ...a.student,
      hr_name: a.hr.hrProfile?.name ?? null,
      hr_company: a.hr.hrProfile?.companyName ?? null,
      status: a.status,
      evaluation_status:
        a.student.evaluations.length > 0 ? "COMPLETED" : "INCOMPLETE",
    }));

    res.json(result);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
// ── GET /students?query= ─────────────────────────────────────────────────────

router.get(
  "/students",
  auth,
  checkRole(["ADMIN"]),
  validate(StudentSearchQuerySchema, "query"),
  async (req, res) => {
    const { query } = req.query as { query: string };
    const terms = query.split(/[\s,]+/).filter((t) => t.length > 0);

    try {
      const assignments = await prisma.hrAssignment.findMany({
        where: {
          student: {
            OR:
              terms.length > 1
                ? [{ registerNumber: { in: terms } }]
                : [
                    {
                      registerNumber: { contains: query, mode: "insensitive" },
                    },
                    { name: { contains: query, mode: "insensitive" } },
                  ],
          },
        },
        include: {
          student: true,
          hr: {
            include: {
              hrProfile: { select: { name: true, companyName: true } },
            },
          },
        },
      });
      const result = assignments.map((a) => ({
        ...a.student,
        hr_name: a.hr.hrProfile?.name ?? null,
        hr_company: a.hr.hrProfile?.companyName ?? null,
        status: a.status,
      }));
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

// ── GET /hrs ─────────────────────────────────────────────────────────────────

router.get("/hrs", auth, checkRole(["ADMIN"]), async (_req, res) => {
  try {
    const hrs = await prisma.hrProfile.findMany({
      orderBy: { name: "asc" },
      include: {
        user: { select: { username: true } },
        volunteers: { select: { name: true } },
      },
    });

    const result = await Promise.all(
      hrs.map(async (hr) => {
        const [total, completed] = await Promise.all([
          prisma.hrAssignment.count({
            where: { hrId: hr.id },
          }),
          prisma.hrAssignment.count({
            where: {
              hrId: hr.id,
              status: InterviewStatus.COMPLETED,
            },
          }),
        ]);
        return {
          ...hr,
          username: hr.user.username,
          volunteer_count: hr.volunteers.length,
          volunteers: hr.volunteers.map((v) => v.name).join(", "),
          total_students: total,
          completed_students: completed,
        };
      }),
    );

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ── GET /hrs/:hrId/students ──────────────────────────────────────────────────

router.get(
  "/hrs/:hrId/students",
  auth,
  checkRole(["ADMIN"]),
  validate(HrIdParamSchema, "params"),
  async (req, res) => {
    try {
      const { hrId } = req.params as HrIdParam;
      const assignments = await prisma.hrAssignment.findMany({
        where: { hrId },
        include: { student: true },
        orderBy: { order: "asc" },
      });

      const students = assignments.map((a) => ({
        ...a.student,
        status: a.status,
      }));
      res.json(students);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

// ── GET /volunteers ──────────────────────────────────────────────────────────

router.get("/volunteers", auth, checkRole(["ADMIN"]), async (_req, res) => {
  try {
    const volunteers = await prisma.volunteerProfile.findMany({
      orderBy: { name: "asc" },
      include: {
        user: { select: { username: true } },
        assignedHr: { select: { name: true, companyName: true } },
      },
    });

    const result = volunteers.map((v) => ({
      ...v,
      username: v.user.username,
      hr_name: v.assignedHr?.name ?? null,
      hr_company: v.assignedHr?.companyName ?? null,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ── POST /students/transfer ──────────────────────────────────────────────────

router.post(
  "/students/transfer",
  auth,
  checkRole(["ADMIN"]),
  validate(StudentTransferSchema),
  async (req, res) => {
    const { studentIds, targetHrId, reason } = req.body;
    const adminId = req.user.id;

    try {
      await prisma.$transaction(async (tx) => {
        for (const studentId of studentIds) {
          const assignment = await tx.hrAssignment.findFirst({
            where: { studentId },
          });

          if (!assignment) continue;

          // Log transfer
          await tx.studentTransfer.create({
            data: {
              studentId,
              fromHrId: assignment.hrId,
              toHrId: targetHrId,
              adminId,
              transferReason: reason,
            },
          });

          // Get next order in target HR
          const last = await tx.hrAssignment.findFirst({
            where: { hrId: targetHrId },
            orderBy: { order: "desc" },
          });

          const nextOrder = last ? last.order + 1 : 1;

          // Update assignment
          await tx.hrAssignment.update({
            where: { id: assignment.id },
            data: {
              hrId: targetHrId,
              order: nextOrder,
              status: InterviewStatus.PENDING,
            },
          });
        }
      });

      res.json({ message: "Transfer successful" });
    } catch (err) {
      res.status(500).send("Server Error");
    }
  },
);
// ── POST /resumes/bulk ───────────────────────────────────────────────────────

router.post(
  "/resumes/bulk",
  auth,
  checkRole(["ADMIN"]),
  uploadResumes.array("files"),
  async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];

      await Promise.all(
        files.map((file) => {
          const registerNumber = path.parse(file.originalname).name;
          return prisma.student.updateMany({
            where: { registerNumber },
            data: { resumeUrl: `/uploads/resumes/${file.originalname}` },
          });
        }),
      );

      res.json({
        message: `${files.length} resumes uploaded and linked successfully`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

// ── POST /students/bulk (CSV) ────────────────────────────────────────────────

router.post(
  "/students/bulk",
  auth,
  checkRole(["ADMIN"]),
  uploadCsv.single("file"),
  async (req, res) => {
    const rawRows: unknown[] = [];

    fs.createReadStream(req.file!.path)
      .pipe(csv())
      .on("data", (data) => rawRows.push(data))
      .on("end", async () => {
        // Validate each CSV row
        const validRows = rawRows.flatMap((row) => {
          const parsed = CsvStudentRowSchema.safeParse(row);
          return parsed.success ? [parsed.data] : [];
        });

        if (validRows.length === 0) {
          fs.unlinkSync(req.file!.path);
          return res
            .status(400)
            .json({ message: "No valid rows found in CSV" });
        }

        try {
          await prisma.$transaction(async (tx) => {
            for (const row of validRows) {
              const regNum = row.register_number!;

              await tx.student.upsert({
                where: { registerNumber: regNum },
                create: {
                  name: row.name,
                  registerNumber: regNum,
                  department: row.department,
                  section: row.section,
                },
                update: {
                  name: row.name,
                  department: row.department,
                  section: row.section,
                },
              });
            }
          });
          fs.unlinkSync(req.file!.path);
          res.json({
            message: `${validRows.length} students registered successfully`,
          });
        } catch (err) {
          console.error(err);
          res.status(500).send("Server Error");
        }
      });
  },
);

// ── POST /register/hr ────────────────────────────────────────────────────────

router.post(
  "/register/hr",
  auth,
  checkRole(["ADMIN"]),
  validate(AdminRegisterHrSchema),
  async (req, res) => {
    const { username, password, name, company_name } = req.body;

    try {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        return res.status(400).json({ message: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { username, passwordHash, role: "HR" },
        });

        await tx.hrProfile.create({
          data: {
            id: user.id,
            name,
            companyName: company_name,
          },
        });
      });

      res.json({ message: "HR Registered Successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

// ── POST /register/volunteer ─────────────────────────────────────────────────

router.post(
  "/register/volunteer",
  auth,
  checkRole(["ADMIN"]),
  validate(AdminRegisterVolunteerSchema),
  async (req, res) => {
    const { username, password, name, hrId } = req.body;

    try {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        return res.status(400).json({ message: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { username, passwordHash, role: "VOLUNTEER" },
        });
        await tx.volunteerProfile.create({
          data: {
            id: user.id,
            name,
            assignedHrId: hrId,
          },
        });
      });

      res.json({ message: "Volunteer Registered Successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

router.post(
  "/reset-password/:userId",
  auth,
  checkRole(["ADMIN"]),
  async (req, res) => {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newPassword = crypto.randomBytes(6).toString("base64");

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      res.json({
        message: "Password reset successfully",
        temporaryPassword: newPassword,
      });
    } catch (err) {
      res.status(500).send("Server Error");
    }
  },
);
export default router;

registry.registerPath({
  method: "post",
  path: "/api/admin/register/hr",
  tags: ["Admin"],
  description: "Register a new HR",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AdminRegisterHrSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "HR registered successfully",
    },
    400: {
      description: "Validation error",
    },
  },
});

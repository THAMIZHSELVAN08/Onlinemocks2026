// src/routes/admin.ts
// Re-check after prisma generate
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
  AdminRegisterPipelineSchema,
  StudentTransferSchema,
  StudentSearchQuerySchema,
  HrIdParamSchema,
  CsvStudentRowSchema,
  CsvHrRowSchema,
  CsvVolunteerRowSchema,
} from "../schemas";
import type { FeedbackHrParam } from "../schemas";
import prisma from "../lib/prisma";
import crypto from "crypto";
const router = express.Router();
import { registry } from "../openapi";
import { UserIdParamSchema } from "../schemas";
import { FeedbackHrParamSchema } from "../schemas";

// ── Multer configs ──────────────────────────────────────────────────────────
const adminSecurity = [{ bearerAuth: [] }];
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

    // Get all students with their evaluations to calculate department stats
    const allStudents = await prisma.student.findMany({
      include: { evaluations: { select: { id: true } } },
    });

    const deptMap: Record<string, { total: number; evaluated: number }> = {};
    let totalEvaluated = 0;

    for (const s of allStudents) {
      const dept = s.department || 'Unknown';
      if (!deptMap[dept]) deptMap[dept] = { total: 0, evaluated: 0 };
      deptMap[dept].total += 1;
      if (s.evaluations && s.evaluations.length > 0) {
        deptMap[dept].evaluated += 1;
        totalEvaluated += 1;
      }
    }

    const departmentStats = Object.entries(deptMap).map(([name, data]) => ({
      name,
      total: data.total,
      evaluated: data.evaluated,
      pending: data.total - data.evaluated,
    }));

    // HR Stats
    const hrData = await prisma.hrProfile.findMany({
      include: {
        user: {
          include: {
            hrAssignments: {
              include: { student: { include: { evaluations: { select: { id: true } } } } },
            },
          },
        },
      },
    });

    const hrStats = hrData.map(hr => {
      const assignments = hr.user.hrAssignments || [];
      const total = assignments.length;
      const evaluated = assignments.filter(a => a.student?.evaluations?.length > 0).length;
      return {
        name: hr.name,
        companyName: hr.companyName,
        total,
        evaluated,
        pending: total - evaluated
      };
    });

    res.json({
      students, // backward compatibility
      hrs,      // backward compatibility
      volunteers, // backward compatibility
      overall: {
        totalStudents: students,
        evaluatedStudents: totalEvaluated,
        pendingStudents: students - totalEvaluated,
        totalHRs: hrs,
        totalVolunteers: volunteers,
      },
      departmentStats,
      hrStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ── GET /students/all ────────────────────────────────────────────────────────

router.get("/students/all", auth, checkRole(["ADMIN", "PIPELINE"]), async (_req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        evaluations: true,
        assignments: {
          include: {
            hr: {
              include: {
                hrProfile: { select: { name: true, companyName: true } },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' }
    });

    const result = students.map((s) => ({
      ...s,
      register_number: s.registerNumber,
      hr_name: s.assignments.map(a => a.hr?.hrProfile?.name).filter(Boolean).join(", ") || "Unallocated",
      hr_company: s.assignments.map(a => a.hr?.hrProfile?.companyName).filter(Boolean).join(", ") || null,
      evaluation_status: s.evaluations.length > 0 ? "COMPLETED" : "PENDING",
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
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
        register_number: a.student.registerNumber,
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

router.get(
  "/students/global",
  auth,
  checkRole(["ADMIN", "PIPELINE"]),
  async (req, res) => {
    const { query } = req.query as { query: string };
    if (!query) return res.json([]);

    try {
      const students = await prisma.student.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { registerNumber: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          assignments: {
            include: {
              hr: {
                include: { hrProfile: { select: { name: true } } },
              },
            },
          },
        },
        take: 50,
      });

      const result = students.map((s) => ({
        ...s,
        register_number: s.registerNumber,
        hr_name: s.assignments.map(a => a.hr.hrProfile?.name).filter(Boolean).join(", ") || "Unassigned",
        status: s.assignments[0]?.status || "UNASSIGNED",
      }));

      res.json(result);
    } catch (err) {
      res.status(500).send("Server Error");
    }
  },
);

// ── GET /hrs ─────────────────────────────────────────────────────────────────

router.get("/hrs", auth, checkRole(["ADMIN", "PIPELINE"]), async (_req, res) => {
  try {
    const hrs = await prisma.hrProfile.findMany({
      orderBy: { name: "asc" },
      include: {
        user: { select: { username: true, plainPassword: true } },
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
          plain_password: hr.user.plainPassword,
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
  checkRole(["ADMIN", "PIPELINE"]),
  validate(HrIdParamSchema, "params"),
  async (req, res) => {
    try {
      const { hrId } = req.params as { hrId: string };
      
      if (hrId === "unassigned") {
        const students = await prisma.student.findMany({
          where: { assignments: { none: {} } },
          orderBy: { name: "asc" },
        });
        return res.json(students.map(s => ({ ...s, register_number: s.registerNumber, status: "UNASSIGNED" })));
      }

      const assignments = await prisma.hrAssignment.findMany({
        where: { hrId },
        include: { student: true },
        orderBy: { order: "asc" },
      });

      const students = assignments.map((a) => ({
        ...a.student,
        register_number: a.student.registerNumber,
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

router.get("/volunteers", auth, checkRole(["ADMIN", "PIPELINE"]), async (_req, res) => {
  try {
    const volunteers = await prisma.volunteerProfile.findMany({
      orderBy: { name: "asc" },
      include: {
        user: { select: { username: true, plainPassword: true } },
        assignedHr: { select: { name: true, companyName: true } },
      },
    });

    const result = volunteers.map((v) => ({
      ...v,
      username: v.user.username,
      hr_name: v.assignedHr?.name ?? null,
      hr_company: v.assignedHr?.companyName ?? null,
      plain_password: v.user.plainPassword,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ── GET /pipeline ────────────────────────────────────────────────────────────

router.get("/pipeline", auth, checkRole(["ADMIN"]), async (_req, res) => {
  try {
    const pipelines = await prisma.pipelineProfile.findMany({
      orderBy: { name: "asc" },
      include: {
        user: { select: { username: true, plainPassword: true } },
      },
    });

    const result = pipelines.map((p: any) => ({
      ...p,
      username: p.user.username,
      plain_password: p.user.plainPassword,
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
  checkRole(["ADMIN", "PIPELINE"]),
  validate(StudentTransferSchema),
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { studentIds, targetHrId, reason } = req.body;
    const adminId = req.user.id;
    console.log(`Transfer request: students=${studentIds}, target=${targetHrId}`);

    try {
      await prisma.$transaction(async (tx) => {
        // Get initial max order
        const last = await tx.hrAssignment.findFirst({
            where: { hrId: targetHrId },
            orderBy: { order: "desc" },
        });
        let currentOrder = last ? last.order : 0;

        for (const studentId of studentIds) {
          currentOrder++;
          console.log(`Processing transfer for student ${studentId} to ${targetHrId}`);

          // Find one previous HR assignment to use as fromHrId for logging
          const previousAssignment = await tx.hrAssignment.findFirst({
            where: { studentId },
          });

          // Remove student from ALL existing assignments to ensure it's a "move" rather than "add"
          await tx.hrAssignment.deleteMany({
            where: { studentId },
          });

          // Create the new assignment for the target HR
          await tx.hrAssignment.create({
            data: {
              studentId,
              hrId: targetHrId,
              order: currentOrder,
              status: InterviewStatus.PENDING,
            },
          });

          // Log the actual transfer in the history table
          await tx.studentTransfer.create({
            data: {
              studentId,
              fromHrId: previousAssignment?.hrId || null,
              toHrId: targetHrId,
              adminId,
              transferReason: reason || "Administrative Transfer",
            },
          });
        }
      });

      // ── Emit real-time notification to HR and their volunteers ──
      const io = req.app.get("socketio");
      if (io) {
        const count = studentIds.length;
        const payload = {
          message: count === 1
            ? "A new student has been added. Check out the dashboard."
            : `${count} new students have been added. Check out the dashboard.`,
          count,
          timestamp: new Date().toISOString(),
        };

        // Notify the target HR
        io.to(targetHrId).emit("student_transferred", payload);
        
        // SAVE NOTIFICATION FOR HR
        await prisma.notification.create({
          data: {
            receiverId: targetHrId,
            title: "Student Transfer",
            message: payload.message,
            type: "TRANSFER",
          } as any
        });

        // Notify all volunteers assigned to this HR
        const volunteers = await prisma.volunteerProfile.findMany({
          where: { assignedHrId: targetHrId },
          select: { id: true },
        });
        for (const v of volunteers) {
          io.to(v.id).emit("student_transferred", payload);
          // SAVE NOTIFICATION FOR VOLUNTEER
          await prisma.notification.create({
            data: {
              receiverId: v.id,
              title: "New Students Assigned",
              message: payload.message,
              type: "TRANSFER",
            } as any
          });
        }
      }

      res.json({ message: "Transfer successful" });
    } catch (err) {
      console.error("Transfer Error:", err);
      res.status(500).send("Server Error");
    }
  },
);
// ── POST /notify ─────────────────────────────────────────────────────────────

router.post(
  "/notify",
  auth,
  checkRole(["ADMIN", "PIPELINE"]),
  async (req, res) => {
    const { title, message, hrIds, volunteerIds } = req.body;

    if (!message || (!hrIds?.length && !volunteerIds?.length)) {
      return res.status(400).json({ message: "Message and at least one recipient required." });
    }

    const io = req.app.get("socketio");
    if (!io) {
      return res.status(500).json({ message: "Socket.io not available." });
    }

    const payload = {
      title: title || "Admin Notification",
      message,
      timestamp: new Date().toISOString(),
    };

    let sent = 0;

    if (hrIds?.length) {
      for (const hrId of hrIds) {
        io.to(hrId).emit("admin_notification", payload);
        sent++;
      }
    }

    if (volunteerIds?.length) {
      for (const volId of volunteerIds) {
        io.to(volId).emit("admin_notification", payload);
        sent++;
      }
    }

    res.json({ message: `Notification sent to ${sent} recipient(s).`, sent });
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
          const registerNumber = path.parse(file.originalname).name.trim();
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
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const rawRows: unknown[] = [];

    fs.createReadStream(req.file!.path)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim().toLowerCase(),
        mapValues: ({ value }) => value.trim(),
      }))
      .on("data", (data) => rawRows.push(data))
      .on("end", async () => {
        // Validate each CSV row
        const validRows = rawRows.flatMap((row) => {
          const parsed = CsvStudentRowSchema.safeParse(row);
          return parsed.success ? [parsed.data] : [];
        });

        if (validRows.length === 0) {
          if (fs.existsSync(req.file!.path)) fs.unlinkSync(req.file!.path);
          return res.status(400).json({ message: "No valid rows found in CSV" });
        }

        try {
          // Prefetch HRs for allocation
          const hrs = await prisma.hrProfile.findMany({ select: { id: true, name: true } });
          const hrMap = new Map(hrs.filter(h => !!h.name).map(h => [h.name!.toLowerCase().trim(), h.id]));

          let createdCount = 0;
          let assignedCount = 0;

          await prisma.$transaction(async (tx) => {
            for (const row of validRows) {
              const regNum = row.register_number!;

              const student = await tx.student.upsert({
                where: { registerNumber: regNum },
                create: {
                  name: row.name,
                  registerNumber: regNum,
                  department: row.department || null,
                  section: row.section || null,
                  resumeUrl: row.resume || null,
                },
                update: {
                  name: row.name,
                  department: row.department || null,
                  section: row.section || null,
                  resumeUrl: row.resume || null,
                },
              });

              createdCount++;

              if (row.allocated_hr) {
                const hrNameRaw = row.allocated_hr.toLowerCase().trim();
                const hrId = hrMap.get(hrNameRaw);

                if (hrId) {
                  // Check if already assigned to THIS HR
                  const existingAssignment = await tx.hrAssignment.findFirst({
                    where: { studentId: student.id, hrId }
                  });

                  if (!existingAssignment) {
                    // Find highest order for this HR
                    const lastAssignment = await tx.hrAssignment.findFirst({
                      where: { hrId },
                      orderBy: { order: 'desc' }
                    });
                    const nextOrder = (lastAssignment?.order ?? 0) + 1;

                    await tx.hrAssignment.create({
                      data: {
                        hrId,
                        studentId: student.id,
                        order: nextOrder,
                        status: 'PENDING'
                      }
                    });
                    assignedCount++;
                  }
                }
              }
            }
          });

          if (fs.existsSync(req.file!.path)) fs.unlinkSync(req.file!.path);
          res.json({
            message: `${createdCount} students processed.${assignedCount > 0 ? ` ${assignedCount} HR assignments created.` : ''}`,
          });
        } catch (err) {
          console.error(err);
          if (fs.existsSync(req.file!.path)) fs.unlinkSync(req.file!.path);
          res.status(500).send("Server Error during bulk import");
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
          data: { username, passwordHash, role: "HR", plainPassword: password },
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

// ── POST /hr/bulk (CSV) ───────────────────────────────────────────────────────

router.post(
  "/hr/bulk",
  auth,
  checkRole(["ADMIN"]),
  uploadCsv.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    
    const rawRows: any[] = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => rawRows.push(data))
      .on("end", async () => {
        const validRows = rawRows.flatMap((row) => {
          const parsed = CsvHrRowSchema.safeParse(row);
          return parsed.success ? [parsed.data] : [];
        });

        if (validRows.length === 0) {
          fs.unlinkSync(req.file!.path);
          return res.status(400).json({ message: "No valid rows found in CSV (Template: name, company)" });
        }

        try {
          let createdCount = 0;
          let skippedCount = 0;

          for (const row of validRows) {
            const fullName = row.name.trim();
            const company = row.company.trim();
            
            // Generate username: name_randomNumbers
            // Generate username: name_randomNumbers (removing spaces)
            const baseUsername = fullName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15);
            const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
            const username = `${baseUsername}${randomSuffix}`;
            const password = `${baseUsername}@${randomSuffix}`; // Simple generated password

            const existing = await prisma.user.findUnique({ where: { username } });
            if (existing) {
              skippedCount++;
              continue;
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            await prisma.$transaction(async (tx) => {
              const user = await tx.user.create({
                data: { username, passwordHash, role: "HR", plainPassword: password },
              });

              await tx.hrProfile.create({
                data: {
                  id: user.id,
                  name: fullName,
                  companyName: company,
                },
              });
            });
            createdCount++;
          }

          fs.unlinkSync(req.file!.path);
          res.json({
            message: `${createdCount} HR accounts created successfully.${skippedCount > 0 ? ` ${skippedCount} skipped.` : ''}`,
            created: createdCount
          });
        } catch (err) {
          console.error(err);
          if (fs.existsSync(req.file!.path)) fs.unlinkSync(req.file!.path);
          res.status(500).send("Server Error during bulk creation");
        }
      });
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
          data: { username, passwordHash, role: "VOLUNTEER", plainPassword: password },
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

// ── POST /volunteers/bulk (CSV) ───────────────────────────────────────────────

router.post(
  "/volunteers/bulk",
  auth,
  checkRole(["ADMIN"]),
  uploadCsv.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const rawRows: any[] = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (data) => rawRows.push(data))
      .on("end", async () => {
        const validRows = rawRows.flatMap((row) => {
          const parsed = CsvVolunteerRowSchema.safeParse(row);
          return parsed.success ? [parsed.data] : [];
        });

        if (validRows.length === 0) {
          fs.unlinkSync(req.file!.path);
          return res.status(400).json({ message: "No valid rows found or incorrect format (name, hr_name)" });
        }

        try {
          // Prefetch HRs to map names to IDs
          const hrs = await prisma.hrProfile.findMany({ select: { id: true, name: true } });
          const hrMap = new Map(hrs.filter(h => !!h.name).map(h => [h.name!.toLowerCase().trim(), h.id]));

          let createdCount = 0;
          let skippedCount = 0;
          let hrNotFoundCount = 0;

          for (const row of validRows) {
            const fullName = row.name.trim();
            const hrName = row.hr_name.toLowerCase().trim();
            
            const hrId = hrMap.get(hrName);
            if (!hrId) {
              hrNotFoundCount++;
              continue;
            }

            // Generate username: name_randomNumbers (removing spaces)
            const baseUsername = fullName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15);
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const username = `${baseUsername}${randomSuffix}`;
            const password = `${baseUsername}@${randomSuffix}`;

            const existing = await prisma.user.findUnique({ where: { username } });
            if (existing) {
              skippedCount++;
              continue;
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            await prisma.$transaction(async (tx) => {
              const user = await tx.user.create({
                data: { username, passwordHash, role: "VOLUNTEER", plainPassword: password },
              });

              await tx.volunteerProfile.create({
                data: {
                  id: user.id,
                  name: fullName,
                  assignedHrId: hrId,
                },
              });
            });
            createdCount++;
          }

          if (fs.existsSync(req.file!.path)) fs.unlinkSync(req.file!.path);
          
          res.json({
            message: `${createdCount} volunteers created.${hrNotFoundCount > 0 ? ` ${hrNotFoundCount} HRs not found.` : ''}${skippedCount > 0 ? ` ${skippedCount} usernames taken.` : ''}`,
            created: createdCount,
            skipped: skippedCount,
            hrNotFound: hrNotFoundCount
          });
        } catch (err) {
          console.error(err);
          if (fs.existsSync(req.file!.path)) fs.unlinkSync(req.file!.path);
          res.status(500).send("Server Error during bulk creation");
        }
      });
  },
);

// ── POST /register/pipeline ──────────────────────────────────────────────────

router.post(
  "/register/pipeline",
  auth,
  checkRole(["ADMIN"]),
  validate(AdminRegisterPipelineSchema),
  async (req, res) => {
    const { username, password, name } = req.body;

    try {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        return res.status(400).json({ message: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { username, passwordHash, role: "PIPELINE", plainPassword: password },
        });
        await tx.pipelineProfile.create({
          data: {
            id: user.id,
            name,
          },
        });
      });

      res.json({ message: "Pipeline User Registered Successfully" });
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

router.get(
  "/feedback/:hrId",
  auth,
  checkRole(["ADMIN"]),
  validate(FeedbackHrParamSchema, "params"),
  async (req, res) => {
    const { hrId } = req.params as FeedbackHrParam;

    try {
      const feedbacks = await prisma.feedback.findMany({
        where: { hrId },
        include: {
          hr: {
            include: {
              hrProfile: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      });

      res.json(feedbacks);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

router.get(
  "/feedback/analytics",
  auth,
  checkRole(["ADMIN"]),
  async (_req, res) => {
    try {
      const result = await prisma.feedback.aggregate({
        _avg: {
          technicalKnowledge: true,
          serviceAndCoordination: true,
          communicationSkills: true,
          futureParticipation: true,
          punctualityAndInterest: true,
        },
      });

      res.json(result._avg);
    } catch (err) {
      res.status(500).send("Server Error");
    }
  },
);

// ── POST /add-student ────────────────────────────────────────────────────────

router.post(
  "/add-student",
  auth,
  checkRole(["ADMIN", "PIPELINE"]),
  async (req, res) => {
    const { name, register_number, department, resume_url, hr_id } = req.body;

    if (!name || !register_number || !hr_id) {
      return res.status(400).json({ message: "Name, Register Number, and HR are required." });
    }

    try {
      // Check if student already exists
      let student = await prisma.student.findUnique({
        where: { registerNumber: register_number },
      });

      if (student) {
        // Check if already assigned to this HR
        const existingAssignment = await prisma.hrAssignment.findFirst({
          where: { studentId: student.id, hrId: hr_id },
        });
        if (existingAssignment) {
          return res.status(400).json({ message: "Student is already assigned to this HR." });
        }
      } else {
        student = await prisma.student.create({
          data: {
            name,
            registerNumber: register_number,
            department,
            resumeUrl: resume_url,
          },
        });
      }

      // Get next order for this HR
      const lastAssignment = await prisma.hrAssignment.findFirst({
        where: { hrId: hr_id },
        orderBy: { order: "desc" },
      });
      const nextOrder = lastAssignment ? lastAssignment.order + 1 : 1;

      await prisma.hrAssignment.create({
        data: {
          hrId: hr_id,
          studentId: student.id,
          order: nextOrder,
        },
      });

      res.json({ message: "Student added and assigned successfully." });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

// ── DELETE /hr/:userId ───────────────────────────────────────────────────────

router.delete(
  "/hr/:userId",
  auth,
  checkRole(["ADMIN"]),
  async (req, res) => {
    const userId = req.params.userId as string;
    try {
      await prisma.$transaction(async (tx) => {
        // Delete evaluations given by this HR
        await tx.evaluation.deleteMany({ where: { hrId: userId } });
        // Delete HR assignments
        await tx.hrAssignment.deleteMany({ where: { hrId: userId } });
        // Unassign volunteers from this HR
        await tx.volunteerProfile.updateMany({
          where: { assignedHrId: userId },
          data: { assignedHrId: null },
        });
        // Delete transfers involving this HR
        await tx.studentTransfer.deleteMany({
          where: { OR: [{ fromHrId: userId }, { toHrId: userId }] },
        });
        // Delete feedbacks
        await tx.feedback.deleteMany({ where: { hrId: userId } });
        // Delete HR profile (cascades to user via schema)
        await tx.hrProfile.delete({ where: { id: userId } });
        // Delete user
        await tx.user.delete({ where: { id: userId } });
      });
      res.json({ message: "HR deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete HR" });
    }
  },
);

// ── DELETE /volunteer/:userId ────────────────────────────────────────────────

router.delete(
  "/volunteer/:userId",
  auth,
  checkRole(["ADMIN"]),
  async (req, res) => {
    const userId = req.params.userId as string;
    try {
      await prisma.$transaction(async (tx) => {
        // Delete volunteer profile (cascades to user via schema)
        await tx.volunteerProfile.delete({ where: { id: userId } });
        // Delete user
        await tx.user.delete({ where: { id: userId } });
      });
      res.json({ message: "Volunteer deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete volunteer" });
    }
  },
);

export default router;

registry.registerPath({
  method: "get",
  path: "/api/admin/feedback/analytics",
  tags: ["Admin"],
  security: [{ bearerAuth: [] }],
  description: "Get average feedback scores across all HRs",
  responses: {
    200: {
      description: "Feedback analytics retrieved",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/feedback/{hrId}",
  tags: ["Admin"],
  security: [{ bearerAuth: [] }],
  description: "Get feedback submitted by a specific HR",
  request: {
    params: FeedbackHrParamSchema,
  },
  responses: {
    200: {
      description: "Feedback retrieved successfully",
    },
  },
});

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

registry.registerPath({
  method: "get",
  path: "/api/admin/stats",
  tags: ["Admin"],
  security: adminSecurity,
  description: "Get total counts of students, HRs, and volunteers",
  responses: {
    200: {
      description: "Statistics retrieved successfully",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/students/all",
  tags: ["Admin"],
  security: adminSecurity,
  description: "Get all students with HR assignment and evaluation status",
  responses: {
    200: {
      description: "Students retrieved successfully",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/students",
  tags: ["Admin"],
  security: adminSecurity,
  description: "Search students by register number or name",
  request: {
    query: StudentSearchQuerySchema,
  },
  responses: {
    200: {
      description: "Students search result",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/hrs",
  tags: ["Admin"],
  security: adminSecurity,
  description: "Get all HRs with volunteer and student statistics",
  responses: {
    200: {
      description: "HR list retrieved",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/hrs/{hrId}/students",
  tags: ["Admin"],
  security: adminSecurity,
  description: "Get students assigned to a specific HR",
  request: {
    params: HrIdParamSchema,
  },
  responses: {
    200: {
      description: "Students for HR retrieved",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/admin/volunteers",
  tags: ["Admin"],
  security: adminSecurity,
  description: "Get all volunteers and their assigned HR",
  responses: {
    200: {
      description: "Volunteers retrieved successfully",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/students/transfer",
  tags: ["Admin"],
  security: adminSecurity,
  description: "Transfer students to another HR",
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
      description: "Transfer successful",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/resumes/bulk",
  tags: ["Admin"],
  security: adminSecurity,
  description: "Upload resumes in bulk (multipart form-data)",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              files: {
                type: "array",
                items: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Resumes uploaded successfully",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/students/bulk",
  tags: ["Admin"],
  security: adminSecurity,
  description: "Upload students via CSV file",
  request: {
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
      description: "Students registered successfully",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/register/hr",
  tags: ["Admin"],
  security: adminSecurity,
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
  },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/register/volunteer",
  tags: ["Admin"],
  security: adminSecurity,
  description: "Register a new Volunteer",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AdminRegisterVolunteerSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Volunteer registered successfully",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/admin/reset-password/{userId}",
  tags: ["Admin"],
  security: adminSecurity,
  description: "Reset a user's password and generate a temporary password",
  request: {
    params: UserIdParamSchema,
  },
  responses: {
    200: {
      description: "Password reset successfully",
    },
    404: {
      description: "User not found",
    },
  },
});

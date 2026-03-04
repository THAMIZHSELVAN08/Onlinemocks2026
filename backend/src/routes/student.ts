// src/routes/student.ts
import express from "express";
import prisma from "../lib/prisma";
import { auth, checkRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CheckInSchema } from "../schemas";

const router = express.Router();

// ── POST /check-in ───────────────────────────────────────────────────────────
router.post(
  "/check-in",
  auth,
  checkRole(["STUDENT" as any]),
  validate(CheckInSchema),
  async (req, res) => {
    // Currently just logs the check-in as there's no specific table for it
    // But we could update a 'lastCheckIn' field if we add it to the schema
    console.log(`Student ${req.user?.id} checked in with device: ${req.body.deviceInfo}`);
    res.json({ message: "Check-in successful" });
  }
);

// ── GET /me ──────────────────────────────────────────────────────────────────
router.get("/me", auth, checkRole(["STUDENT" as any]), async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
      include: {
        assignments: {
          include: {
            hr: {
              select: {
                hrProfile: {
                  select: {
                    name: true,
                    companyName: true,
                  }
                }
              }
            }
          }
        },
        evaluations: true,
      },
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json(student);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

export default router;

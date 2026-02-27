// src/routes/volunteer.ts
import express from "express";
import bcrypt from "bcryptjs";
import { auth, checkRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { AddStudentSchema } from "../schemas";
import { prisma } from "../lib/prisma";
const router = express.Router();

// ── GET /students ────────────────────────────────────────────────────────────

router.get("/students", auth, checkRole(["VOLUNTEER"]), async (req, res) => {
  try {
    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { id: req.user.id },
      select: { assignedHrId: true },
    });

    if (!volunteer?.assignedHrId) {
      return res
        .status(403)
        .json({ message: "No HR assigned to this volunteer" });
    }

    const students = await prisma.student.findMany({
      where: { currentHrId: volunteer.assignedHrId },
      include: { evaluation: { select: { studentId: true } } },
    });

    const result = students.map((s) => ({
      ...s,
      evaluation_status: s.evaluation ? "COMPLETED" : "INCOMPLETE",
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// ── POST /student ─────────────────────────────────────────────────────────────

router.post(
  "/student",
  auth,
  checkRole(["VOLUNTEER"]),
  validate(AddStudentSchema),
  async (req, res) => {
    const { name, register_number, department, section } = req.body;

    try {
      const volunteer = await prisma.volunteerProfile.findUnique({
        where: { id: req.user.id },
        select: { assignedHrId: true },
      });

      if (!volunteer?.assignedHrId) {
        return res
          .status(403)
          .json({ message: "No HR assigned to this volunteer" });
      }

      const existing = await prisma.user.findUnique({
        where: { username: register_number },
      });
      if (existing) {
        return res.status(400).json({ message: "Student already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(register_number, salt);

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { username: register_number, passwordHash, role: "STUDENT" },
        });

        await tx.student.create({
          data: {
            id: user.id,
            name,
            registerNumber: register_number,
            department,
            section,
            currentHrId: volunteer.assignedHrId,
          },
        });
      });

      res.json({ message: "Student added successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

export default router;

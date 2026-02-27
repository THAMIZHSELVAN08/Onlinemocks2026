// src/routes/student.ts
import express from "express";
import { auth, checkRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CheckInSchema } from "../schemas";
import { prisma } from "../lib/prisma";
const router = express.Router();

// ── POST /check-in ───────────────────────────────────────────────────────────

router.post(
  "/check-in",
  auth,
  checkRole(["STUDENT"]),
  validate(CheckInSchema),
  async (req, res) => {
    const { deviceInfo } = req.body;
    const ipAddress = req.ip;

    try {
      await prisma.attendance.create({
        data: {
          studentId: req.user.id,
          ipAddress,
          deviceInfo,
        },
      });
      res.json({ message: "Attendance marked successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

// ── GET /profile ─────────────────────────────────────────────────────────────

router.get("/profile", auth, checkRole(["STUDENT"]), async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
      include: { user: { select: { username: true } } },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ ...student, username: student.user.username });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

export default router;

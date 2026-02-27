// src/routes/hr.ts
import express from "express";
import { prisma } from "./admin";
import { auth, checkRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { EvaluateStudentSchema, StudentIdParamSchema } from "../schemas";
import type { StudentIdParam } from "../schemas";
const router = express.Router();
// ── GET /students ────────────────────────────────────────────────────────────
router.get("/students", auth, checkRole(["HR"]), async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: { currentHrId: req.user.id },
      include: {
        user: { select: { username: true, id: true } },
        evaluation: { select: { studentId: true } },
      },
    });

    const result = students.map((s) => ({
      ...s,
      username: s.user.username,
      user_id: s.user.id,
      evaluation_status: s.evaluation ? "COMPLETED" : "INCOMPLETE",
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
      const { id } = req.params as StudentIdParam;

      const student = await prisma.student.findFirst({
        where: { id: id, currentHrId: req.user.id },
        include: {
          user: { select: { username: true } },
          currentHr: {
            include: {
              hrProfile: { select: { name: true, companyName: true } },
            },
          },
        },
      });

      if (!student) {
        return res
          .status(404)
          .json({ message: "Student not found or not assigned to you" });
      }

      res.json({
        ...student,
        username: student.user.username,
        hr_name: student.currentHr?.hrProfile?.name ?? null,
        hr_company: student.currentHr?.hrProfile?.companyName ?? null,
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
      await prisma.evaluation.upsert({
        where: { studentId },
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
          hrId: req.user.id,
          ...criteria,
          strengths,
          improvements,
          comments,
          overallScore,
          evaluationDate: new Date(),
        },
      });

      res.json({ message: "Evaluation submitted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  },
);

export default router;

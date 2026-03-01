// src/routes/hr.ts
import express from "express";
import prisma from "../lib/prisma";
import { auth, checkRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { EvaluateStudentSchema, StudentIdParamSchema } from "../schemas";
import type { StudentIdParam } from "../schemas";
import { InterviewStatus } from "@prisma/client";
const router = express.Router();
// ── GET /students ────────────────────────────────────────────────────────────
router.get("/students", auth, checkRole(["HR"]), async (req, res) => {
  try {
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

export default router;

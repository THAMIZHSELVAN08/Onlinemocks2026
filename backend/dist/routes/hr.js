"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/hr.ts
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../schemas");
const client_1 = require("@prisma/client");
const openapi_1 = require("../openapi");
const hrSecurity = [{ bearerAuth: [] }];
const router = express_1.default.Router();
// ── GET /stats ───────────────────────────────────────────────────────────────
router.get("/stats", auth_1.auth, (0, auth_1.checkRole)(["HR"]), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const [total, completed, pending] = await Promise.all([
            prisma_1.default.hrAssignment.count({ where: { hrId: req.user.id } }),
            prisma_1.default.hrAssignment.count({
                where: { hrId: req.user.id, status: "COMPLETED" },
            }),
            prisma_1.default.hrAssignment.count({
                where: { hrId: req.user.id, status: "PENDING" },
            }),
        ]);
        res.json({ total, completed, pending });
    }
    catch (err) {
        res.status(500).send("Server Error");
    }
});
// ── GET /students ────────────────────────────────────────────────────────────
router.get("/students", auth_1.auth, (0, auth_1.checkRole)(["HR"]), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = req.user; // Now narrowed
        const assignments = await prisma_1.default.hrAssignment.findMany({
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
            evaluation_status: a.student.evaluations.length > 0 ? "COMPLETED" : "INCOMPLETE",
        }));
        res.json(result);
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ── GET /student/:id ─────────────────────────────────────────────────────────
router.get("/student/:id", auth_1.auth, (0, auth_1.checkRole)(["HR"]), (0, validate_1.validate)(schemas_1.StudentIdParamSchema, "params"), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id } = req.params;
        const assignment = await prisma_1.default.hrAssignment.findFirst({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ── POST /evaluate ───────────────────────────────────────────────────────────
router.post("/evaluate", auth_1.auth, (0, auth_1.checkRole)(["HR"]), (0, validate_1.validate)(schemas_1.EvaluateStudentSchema), async (req, res) => {
    const { studentId, criteria, strengths, improvements, comments, overallScore, } = req.body;
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // ensure student is assigned to HR
        const assignment = await prisma_1.default.hrAssignment.findFirst({
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
        await prisma_1.default.evaluation.upsert({
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
        await prisma_1.default.hrAssignment.update({
            where: { id: assignment.id },
            data: { status: "COMPLETED" },
        });
        res.json({ message: "Evaluation submitted successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// --- when they dont show up , loop at end of queue--------
router.post("/no-show/:assignmentId", auth_1.auth, (0, auth_1.checkRole)(["HR"]), async (req, res) => {
    const { assignmentId } = req.params;
    await prisma_1.default.hrAssignment.update({
        where: { id: Number(assignmentId) },
        data: { status: client_1.InterviewStatus.NO_SHOW },
    });
    res.json({ message: "Marked as no-show" });
});
router.post("/feedback", auth_1.auth, (0, auth_1.checkRole)(["HR"]), (0, validate_1.validate)(schemas_1.SubmitFeedbackSchema), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const feedback = await prisma_1.default.feedback.create({
            data: {
                hrId: req.user.id,
                ...req.body,
            },
        });
        res.json({ message: "Feedback submitted successfully", feedback });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
router.get("/notifications", auth_1.auth, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const notifications = await prisma_1.default.notification.findMany({
            where: { receiverId: req.user.id },
            orderBy: { createdAt: "desc" },
        });
        res.json(notifications);
    }
    catch (err) {
        res.status(500).send("Server Error");
    }
});
router.patch("/notifications/:id/read", auth_1.auth, async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string")
            return res.status(400).json({ message: "Invalid ID" });
        await prisma_1.default.notification.update({
            where: { id },
            data: { isRead: true },
        });
        res.json({ message: "Marked as read" });
    }
    catch (err) {
        res.status(500).send("Server Error");
    }
});
router.post("/notifications/read-all", auth_1.auth, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        await prisma_1.default.notification.updateMany({
            where: { receiverId: req.user.id, isRead: false },
            data: { isRead: true },
        });
        res.json({ message: "All marked as read" });
    }
    catch (err) {
        res.status(500).send("Server Error");
    }
});
router.delete("/notifications/:id", auth_1.auth, async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof id !== "string")
            return res.status(400).json({ message: "Invalid ID" });
        await prisma_1.default.notification.delete({
            where: { id },
        });
        res.json({ message: "Notification deleted" });
    }
    catch (err) {
        res.status(500).send("Server Error");
    }
});
exports.default = router;
openapi_1.registry.registerPath({
    method: "get",
    path: "/api/hr/students",
    tags: ["HR"],
    security: hrSecurity,
    description: "Get all students assigned to the logged-in HR in interview order",
    responses: {
        200: {
            description: "Assigned students retrieved successfully",
        },
    },
});
openapi_1.registry.registerPath({
    method: "get",
    path: "/api/hr/student/{id}",
    tags: ["HR"],
    security: hrSecurity,
    description: "Get details of a specific assigned student",
    request: {
        params: schemas_1.StudentIdParamSchema,
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
openapi_1.registry.registerPath({
    method: "post",
    path: "/api/hr/evaluate",
    tags: ["HR"],
    security: hrSecurity,
    description: "Submit or update evaluation for an assigned student",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: schemas_1.EvaluateStudentSchema,
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
openapi_1.registry.registerPath({
    method: "post",
    path: "/api/hr/no-show/{assignmentId}",
    tags: ["HR"],
    security: hrSecurity,
    description: "Mark a student as no-show for the given assignment",
    request: {
        params: schemas_1.AssignmentIdParamSchema,
    },
    responses: {
        200: {
            description: "Marked as no-show",
        },
    },
});
openapi_1.registry.registerPath({
    method: "post",
    path: "/api/hr/feedback",
    tags: ["HR"],
    security: [{ bearerAuth: [] }],
    description: "Submit feedback about recruitment experience",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: schemas_1.SubmitFeedbackSchema,
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

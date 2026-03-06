"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/volunteer.ts
const express_1 = __importDefault(require("express"));
const openapi_1 = require("../openapi");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../schemas");
const prisma_1 = __importDefault(require("../lib/prisma"));
const router = express_1.default.Router();
const zod_1 = __importDefault(require("zod"));
// ── GET /stats ───────────────────────────────────────────────────────────────
router.get("/stats", auth_1.auth, (0, auth_1.checkRole)(["VOLUNTEER"]), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const volunteer = await prisma_1.default.volunteerProfile.findUnique({
            where: { id: req.user.id },
            select: { assignedHrId: true },
        });
        if (!volunteer?.assignedHrId) {
            return res.json({ enrolledToday: 0, totalEnrolled: 0 });
        }
        const [today, total] = await Promise.all([
            prisma_1.default.hrAssignment.count({
                where: {
                    hrId: volunteer.assignedHrId,
                    assignedAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
            prisma_1.default.hrAssignment.count({
                where: { hrId: volunteer.assignedHrId },
            }),
        ]);
        res.json({ enrolledToday: today, totalEnrolled: total });
    }
    catch (err) {
        res.status(500).send("Server Error");
    }
});
// ── GET /students ────────────────────────────────────────────────────────────
router.get("/students", auth_1.auth, (0, auth_1.checkRole)(["VOLUNTEER"]), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const volunteer = await prisma_1.default.volunteerProfile.findUnique({
            where: { id: req.user.id },
            select: { assignedHrId: true },
        });
        if (!volunteer?.assignedHrId) {
            return res
                .status(403)
                .json({ message: "No HR assigned to this volunteer" });
        }
        const assignments = await prisma_1.default.hrAssignment.findMany({
            where: { hrId: volunteer.assignedHrId },
            include: {
                student: {
                    include: {
                        evaluations: {
                            where: { hrId: volunteer.assignedHrId },
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
// ── POST /student ─────────────────────────────────────────────────────────────
router.post("/enroll", auth_1.auth, (0, auth_1.checkRole)(["VOLUNTEER"]), (0, validate_1.validate)(schemas_1.AddStudentSchema), async (req, res) => {
    const { name, register_number, department, section, resume_url } = req.body;
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const volunteer = await prisma_1.default.volunteerProfile.findUnique({
            where: { id: req.user.id },
            select: { assignedHrId: true },
        });
        if (!volunteer?.assignedHrId) {
            return res
                .status(403)
                .json({ message: "No HR assigned to this volunteer" });
        }
        // 1️⃣ Find or create student
        let student = await prisma_1.default.student.findUnique({
            where: { registerNumber: register_number },
        });
        if (!student) {
            student = await prisma_1.default.student.create({
                data: {
                    name,
                    registerNumber: register_number,
                    department,
                    section,
                    resumeUrl: resume_url,
                },
            });
        }
        // 2️⃣ Check existing assignment anywhere
        const existingAssignment = await prisma_1.default.hrAssignment.findFirst({
            where: { studentId: student.id },
        });
        if (existingAssignment) {
            // If already assigned to same HR
            if (existingAssignment.hrId === volunteer.assignedHrId) {
                return res.status(400).json({
                    message: "Student already assigned to your HR",
                });
            }
            // If status NOT cancelled → block transfer
            if (existingAssignment.status !== "CANCELLED") {
                return res.status(400).json({
                    message: "Student is currently active under another HR. They must be cancelled before reallocation.",
                });
            }
            // If cancelled → transfer
            const lastAssignment = await prisma_1.default.hrAssignment.findFirst({
                where: { hrId: volunteer.assignedHrId },
                orderBy: { order: "desc" },
            });
            const nextOrder = lastAssignment ? lastAssignment.order + 1 : 1;
            await prisma_1.default.hrAssignment.update({
                where: { id: existingAssignment.id },
                data: {
                    hrId: volunteer.assignedHrId,
                    order: nextOrder,
                    status: "PENDING",
                },
            });
            return res.json({ message: "Student transferred successfully" });
        }
        // 3️⃣ No assignment exists → normal assignment
        const lastAssignment = await prisma_1.default.hrAssignment.findFirst({
            where: { hrId: volunteer.assignedHrId },
            orderBy: { order: "desc" },
        });
        const nextOrder = lastAssignment ? lastAssignment.order + 1 : 1;
        await prisma_1.default.hrAssignment.create({
            data: {
                hrId: volunteer.assignedHrId,
                studentId: student.id,
                order: nextOrder,
            },
        });
        res.json({ message: "Student assigned successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
router.patch("/cancel/:assignmentId", auth_1.auth, (0, auth_1.checkRole)(["VOLUNTEER"]), (0, validate_1.validate)(schemas_1.CancelAssignmentParamSchema, "params"), async (req, res) => {
    const parsed = schemas_1.CancelAssignmentParamSchema.parse(req.params);
    const { assignmentId } = parsed;
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const volunteer = await prisma_1.default.volunteerProfile.findUnique({
            where: { id: req.user.id },
            select: { assignedHrId: true },
        });
        if (!volunteer?.assignedHrId) {
            return res.status(403).json({
                message: "No HR assigned to this volunteer",
            });
        }
        const assignment = await prisma_1.default.hrAssignment.findUnique({
            where: { id: assignmentId },
        });
        if (!assignment) {
            return res.status(404).json({
                message: "Assignment not found",
            });
        }
        if (assignment.hrId !== volunteer.assignedHrId) {
            return res.status(403).json({
                message: "Not authorized to cancel this assignment",
            });
        }
        await prisma_1.default.hrAssignment.update({
            where: { id: assignmentId },
            data: { status: "CANCELLED" },
        });
        res.json({ message: "Student deallocated successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
//Create a feature for changing order of students
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
    path: "/api/volunteer/students",
    tags: ["Volunteer"],
    security: [{ bearerAuth: [] }],
    description: "Retrieve all students assigned to the volunteer's HR in interview order.",
    responses: {
        200: {
            description: "Students retrieved successfully",
            content: {
                "application/json": {
                    schema: zod_1.default.array(schemas_1.VolunteerStudentResponseSchema),
                },
            },
        },
        403: {
            description: "Volunteer has no HR assigned",
        },
    },
});
openapi_1.registry.registerPath({
    method: "post",
    path: "/api/volunteer/enroll",
    tags: ["Volunteer"],
    security: [{ bearerAuth: [] }],
    description: `
Assign a student to the volunteer's HR.

Behavior:
- If student does not exist → create and assign.
- If assigned to same HR → error.
- If assigned to another HR and NOT cancelled → error.
- If cancelled under another HR → transfer to volunteer's HR.
`,
    request: {
        body: {
            content: {
                "application/json": {
                    schema: schemas_1.AddStudentSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Students assigned successfully",
        },
        400: {
            description: "Student already assigned or active under another HR",
        },
        403: {
            description: "Volunteer has no HR assigned",
        },
    },
});
openapi_1.registry.registerPath({
    method: "patch",
    path: "/api/volunteer/cancel/{assignmentId}",
    tags: ["Volunteer"],
    security: [{ bearerAuth: [] }],
    description: `
Cancel (deallocate) a student from the volunteer's assigned HR.

Business Rules:
- Volunteer must belong to an HR.
- Volunteer can only cancel assignments under their HR.
- Assignment status will be set to CANCELLED.
- Assignment record is NOT deleted (audit-safe).
- Once cancelled, student becomes eligible for reassignment.
`,
    request: {
        params: schemas_1.CancelAssignmentParamSchema,
    },
    responses: {
        200: {
            description: "Student successfully deallocated",
            content: {
                "application/json": {
                    schema: schemas_1.CancelAssignmentResponseSchema,
                },
            },
        },
        403: {
            description: "Volunteer not assigned to HR or unauthorized to cancel this assignment",
        },
        404: {
            description: "Assignment not found",
        },
    },
});
//PUT /api/volunteer/reorder
//{
//  assignmentId: number,
//  newOrder: number
//}

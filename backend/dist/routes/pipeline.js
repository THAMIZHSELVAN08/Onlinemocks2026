"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/pipeline.ts
const openapi_1 = require("../openapi");
const zod_1 = require("zod");
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../schemas");
const router = express_1.default.Router();
const pipelineSecurity = [{ bearerAuth: [] }];
// ─────────────────────────────────────────────
// Multer setup for resume upload
// ─────────────────────────────────────────────
const resumeStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, "uploads/resumes/"),
    filename: (req, _file, cb) => {
        const regNo = req.params.registerNumber || Date.now().toString();
        cb(null, `${regNo}.pdf`);
    },
});
const uploadResume = (0, multer_1.default)({ storage: resumeStorage });
// ─────────────────────────────────────────────
// GET /students
// View all students in system
// ─────────────────────────────────────────────
router.get("/students", auth_1.auth, (0, auth_1.checkRole)(["PIPELINE"]), async (_req, res) => {
    try {
        const students = await prisma_1.default.student.findMany({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ─────────────────────────────────────────────
// POST /student
// Add student to system
// ─────────────────────────────────────────────
router.post("/student", auth_1.auth, (0, auth_1.checkRole)(["PIPELINE"]), (0, validate_1.validate)(schemas_1.AddStudentSchema), async (req, res) => {
    const { name, registerNumber, department, section } = req.body;
    try {
        const existing = await prisma_1.default.student.findUnique({
            where: { registerNumber },
        });
        if (existing) {
            return res.status(400).json({
                message: "Student already exists",
            });
        }
        const student = await prisma_1.default.student.create({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ─────────────────────────────────────────────
// POST /resume/:registerNumber
// Upload resume for student
// ─────────────────────────────────────────────
router.post("/resume/:registerNumber", auth_1.auth, (0, auth_1.checkRole)(["PIPELINE"]), uploadResume.single("file"), async (req, res) => {
    const registerNumber = Array.isArray(req.params.registerNumber)
        ? req.params.registerNumber[0]
        : req.params.registerNumber;
    try {
        const student = await prisma_1.default.student.findUnique({
            where: { registerNumber },
        });
        if (!student) {
            return res.status(404).json({
                message: "Student not found",
            });
        }
        await prisma_1.default.student.update({
            where: { registerNumber },
            data: {
                resumeUrl: `/uploads/resumes/${req.file?.filename}`,
            },
        });
        res.json({
            message: "Resume uploaded successfully",
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ─────────────────────────────────────────────
// POST /transfer
// Assign student to HR (pipeline allocation)
// ─────────────────────────────────────────────
router.post("/transfer", auth_1.auth, (0, auth_1.checkRole)(["PIPELINE"]), (0, validate_1.validate)(schemas_1.StudentTransferSchema), async (req, res) => {
    const { studentIds, targetHrId, reason } = req.body;
    try {
        await prisma_1.default.$transaction(async (tx) => {
            for (const studentId of studentIds) {
                // Check if already assigned to THIS specific HR
                const existingForTarget = await tx.hrAssignment.findFirst({
                    where: { studentId, hrId: targetHrId },
                });
                if (!existingForTarget) {
                    const lastAssignment = await tx.hrAssignment.findFirst({
                        where: { hrId: targetHrId },
                        orderBy: { order: "desc" },
                    });
                    const nextOrder = lastAssignment ? lastAssignment.order + 1 : 1;
                    await tx.hrAssignment.create({
                        data: {
                            hrId: targetHrId,
                            studentId,
                            order: nextOrder,
                        },
                    });
                    await tx.studentTransfer.create({
                        data: {
                            studentId,
                            fromHrId: null, // Additive allocation
                            toHrId: targetHrId,
                            transferReason: reason,
                        },
                    });
                }
            }
        });
        res.json({ message: "Students allocated successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
exports.default = router;
openapi_1.registry.registerPath({
    method: "get",
    path: "/api/pipeline/students",
    tags: ["Pipeline"],
    security: pipelineSecurity,
    description: "Retrieve all students in the system along with their HR assignments.",
    responses: {
        200: {
            description: "List of all students",
        },
        403: {
            description: "Access denied (PIPELINE role required)",
        },
    },
});
openapi_1.registry.registerPath({
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
                    schema: schemas_1.AddStudentSchema,
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
openapi_1.registry.registerPath({
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
        params: zod_1.z.object({
            registerNumber: zod_1.z.string(),
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
openapi_1.registry.registerPath({
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
                    schema: schemas_1.StudentTransferSchema,
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

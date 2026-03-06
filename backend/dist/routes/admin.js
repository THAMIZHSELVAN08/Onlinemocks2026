"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/admin.ts
// Re-check after prisma generate
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../schemas");
const prisma_1 = __importDefault(require("../lib/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
const openapi_1 = require("../openapi");
const schemas_2 = require("../schemas");
const schemas_3 = require("../schemas");
// ── Multer configs ──────────────────────────────────────────────────────────
const adminSecurity = [{ bearerAuth: [] }];
const resumeStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, "uploads/resumes/"),
    filename: (_req, file, cb) => cb(null, file.originalname),
});
const uploadResumes = (0, multer_1.default)({ storage: resumeStorage });
const uploadCsv = (0, multer_1.default)({ dest: "uploads/temp/" });
// ── GET /stats ───────────────────────────────────────────────────────────────
router.get("/stats", auth_1.auth, (0, auth_1.checkRole)(["ADMIN"]), async (_req, res) => {
    try {
        const [students, hrs, volunteers] = await Promise.all([
            prisma_1.default.student.count(),
            prisma_1.default.hrProfile.count(),
            prisma_1.default.volunteerProfile.count(),
        ]);
        // Get all students with their evaluations to calculate department stats
        const allStudents = await prisma_1.default.student.findMany({
            include: { evaluations: { select: { id: true } } },
        });
        const deptMap = {};
        let totalEvaluated = 0;
        for (const s of allStudents) {
            const dept = s.department || 'Unknown';
            if (!deptMap[dept])
                deptMap[dept] = { total: 0, evaluated: 0 };
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
        const hrData = await prisma_1.default.hrProfile.findMany({
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
            hrs, // backward compatibility
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ── GET /students/all ────────────────────────────────────────────────────────
router.get("/students/all", auth_1.auth, (0, auth_1.checkRole)(["ADMIN", "PIPELINE"]), async (_req, res) => {
    try {
        const students = await prisma_1.default.student.findMany({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ── GET /students?query= ─────────────────────────────────────────────────────
router.get("/students", auth_1.auth, (0, auth_1.checkRole)(["ADMIN"]), (0, validate_1.validate)(schemas_1.StudentSearchQuerySchema, "query"), async (req, res) => {
    const { query } = req.query;
    const terms = query.split(/[\s,]+/).filter((t) => t.length > 0);
    try {
        const assignments = await prisma_1.default.hrAssignment.findMany({
            where: {
                student: {
                    OR: terms.length > 1
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
router.get("/students/global", auth_1.auth, (0, auth_1.checkRole)(["ADMIN", "PIPELINE"]), async (req, res) => {
    const { query } = req.query;
    if (!query)
        return res.json([]);
    try {
        const students = await prisma_1.default.student.findMany({
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
    }
    catch (err) {
        res.status(500).send("Server Error");
    }
});
// ── GET /hrs ─────────────────────────────────────────────────────────────────
router.get("/hrs", auth_1.auth, (0, auth_1.checkRole)(["ADMIN", "PIPELINE"]), async (_req, res) => {
    try {
        const hrs = await prisma_1.default.hrProfile.findMany({
            orderBy: { name: "asc" },
            include: {
                user: { select: { username: true, plainPassword: true } },
                volunteers: { select: { name: true } },
            },
        });
        const result = await Promise.all(hrs.map(async (hr) => {
            const [total, completed] = await Promise.all([
                prisma_1.default.hrAssignment.count({
                    where: { hrId: hr.id },
                }),
                prisma_1.default.hrAssignment.count({
                    where: {
                        hrId: hr.id,
                        status: client_1.InterviewStatus.COMPLETED,
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
        }));
        res.json(result);
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ── GET /hrs/:hrId/students ──────────────────────────────────────────────────
router.get("/hrs/:hrId/students", auth_1.auth, (0, auth_1.checkRole)(["ADMIN", "PIPELINE"]), (0, validate_1.validate)(schemas_1.HrIdParamSchema, "params"), async (req, res) => {
    try {
        const { hrId } = req.params;
        if (hrId === "unassigned") {
            const students = await prisma_1.default.student.findMany({
                where: { assignments: { none: {} } },
                orderBy: { name: "asc" },
            });
            return res.json(students.map(s => ({ ...s, register_number: s.registerNumber, status: "UNASSIGNED" })));
        }
        const assignments = await prisma_1.default.hrAssignment.findMany({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ── GET /volunteers ──────────────────────────────────────────────────────────
router.get("/volunteers", auth_1.auth, (0, auth_1.checkRole)(["ADMIN", "PIPELINE"]), async (_req, res) => {
    try {
        const volunteers = await prisma_1.default.volunteerProfile.findMany({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ── GET /pipeline ────────────────────────────────────────────────────────────
router.get("/pipeline", auth_1.auth, (0, auth_1.checkRole)(["ADMIN"]), async (_req, res) => {
    try {
        const pipelines = await prisma_1.default.pipelineProfile.findMany({
            orderBy: { name: "asc" },
            include: {
                user: { select: { username: true, plainPassword: true } },
            },
        });
        const result = pipelines.map((p) => ({
            ...p,
            username: p.user.username,
            plain_password: p.user.plainPassword,
        }));
        res.json(result);
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ── POST /students/transfer ──────────────────────────────────────────────────
router.post("/students/transfer", auth_1.auth, (0, auth_1.checkRole)(["ADMIN", "PIPELINE"]), (0, validate_1.validate)(schemas_1.StudentTransferSchema), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { studentIds, targetHrId, reason } = req.body;
    const adminId = req.user.id;
    console.log(`Transfer request: students=${studentIds}, target=${targetHrId}`);
    try {
        await prisma_1.default.$transaction(async (tx) => {
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
                        status: client_1.InterviewStatus.PENDING,
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
            await prisma_1.default.notification.create({
                data: {
                    receiverId: targetHrId,
                    title: "Student Transfer",
                    message: payload.message,
                    type: "TRANSFER",
                }
            });
            // Notify all volunteers assigned to this HR
            const volunteers = await prisma_1.default.volunteerProfile.findMany({
                where: { assignedHrId: targetHrId },
                select: { id: true },
            });
            for (const v of volunteers) {
                io.to(v.id).emit("student_transferred", payload);
                // SAVE NOTIFICATION FOR VOLUNTEER
                await prisma_1.default.notification.create({
                    data: {
                        receiverId: v.id,
                        title: "New Students Assigned",
                        message: payload.message,
                        type: "TRANSFER",
                    }
                });
            }
        }
        res.json({ message: "Transfer successful" });
    }
    catch (err) {
        console.error("Transfer Error:", err);
        res.status(500).send("Server Error");
    }
});
// ── POST /notify ─────────────────────────────────────────────────────────────
router.post("/notify", auth_1.auth, (0, auth_1.checkRole)(["ADMIN", "PIPELINE"]), async (req, res) => {
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
});
// ── POST /resumes/bulk ───────────────────────────────────────────────────────
router.post("/resumes/bulk", auth_1.auth, (0, auth_1.checkRole)(["ADMIN"]), uploadResumes.array("files"), async (req, res) => {
    try {
        const files = req.files;
        await Promise.all(files.map((file) => {
            const registerNumber = path_1.default.parse(file.originalname).name.trim();
            return prisma_1.default.student.updateMany({
                where: { registerNumber },
                data: { resumeUrl: `/uploads/resumes/${file.originalname}` },
            });
        }));
        res.json({
            message: `${files.length} resumes uploaded and linked successfully`,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ── POST /students/bulk (CSV) ────────────────────────────────────────────────
router.post("/students/bulk", auth_1.auth, (0, auth_1.checkRole)(["ADMIN"]), uploadCsv.single("file"), async (req, res) => {
    const rawRows = [];
    fs_1.default.createReadStream(req.file.path)
        .pipe((0, csv_parser_1.default)())
        .on("data", (data) => rawRows.push(data))
        .on("end", async () => {
        // Validate each CSV row
        const validRows = rawRows.flatMap((row) => {
            const parsed = schemas_1.CsvStudentRowSchema.safeParse(row);
            return parsed.success ? [parsed.data] : [];
        });
        if (validRows.length === 0) {
            fs_1.default.unlinkSync(req.file.path);
            return res
                .status(400)
                .json({ message: "No valid rows found in CSV" });
        }
        try {
            await prisma_1.default.$transaction(async (tx) => {
                for (const row of validRows) {
                    const regNum = row.register_number;
                    await tx.student.upsert({
                        where: { registerNumber: regNum },
                        create: {
                            name: row.name,
                            registerNumber: regNum,
                            department: row.department,
                            section: row.section,
                            resumeUrl: row.resume,
                        },
                        update: {
                            name: row.name,
                            department: row.department,
                            section: row.section,
                            resumeUrl: row.resume,
                        },
                    });
                }
            });
            fs_1.default.unlinkSync(req.file.path);
            res.json({
                message: `${validRows.length} students registered successfully`,
            });
        }
        catch (err) {
            console.error(err);
            res.status(500).send("Server Error");
        }
    });
});
// ── POST /register/hr ────────────────────────────────────────────────────────
router.post("/register/hr", auth_1.auth, (0, auth_1.checkRole)(["ADMIN"]), (0, validate_1.validate)(schemas_1.AdminRegisterHrSchema), async (req, res) => {
    const { username, password, name, company_name } = req.body;
    try {
        const existing = await prisma_1.default.user.findUnique({ where: { username } });
        if (existing) {
            return res.status(400).json({ message: "User already exists" });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        await prisma_1.default.$transaction(async (tx) => {
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ── POST /register/volunteer ─────────────────────────────────────────────────
router.post("/register/volunteer", auth_1.auth, (0, auth_1.checkRole)(["ADMIN"]), (0, validate_1.validate)(schemas_1.AdminRegisterVolunteerSchema), async (req, res) => {
    const { username, password, name, hrId } = req.body;
    try {
        const existing = await prisma_1.default.user.findUnique({ where: { username } });
        if (existing) {
            return res.status(400).json({ message: "User already exists" });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        await prisma_1.default.$transaction(async (tx) => {
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ── POST /register/pipeline ──────────────────────────────────────────────────
router.post("/register/pipeline", auth_1.auth, (0, auth_1.checkRole)(["ADMIN"]), (0, validate_1.validate)(schemas_1.AdminRegisterPipelineSchema), async (req, res) => {
    const { username, password, name } = req.body;
    try {
        const existing = await prisma_1.default.user.findUnique({ where: { username } });
        if (existing) {
            return res.status(400).json({ message: "User already exists" });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        await prisma_1.default.$transaction(async (tx) => {
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
router.post("/reset-password/:userId", auth_1.auth, (0, auth_1.checkRole)(["ADMIN"]), async (req, res) => {
    const userId = Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const newPassword = crypto_1.default.randomBytes(6).toString("base64");
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
        res.json({
            message: "Password reset successfully",
            temporaryPassword: newPassword,
        });
    }
    catch (err) {
        res.status(500).send("Server Error");
    }
});
router.get("/feedback/:hrId", auth_1.auth, (0, auth_1.checkRole)(["ADMIN"]), (0, validate_1.validate)(schemas_3.FeedbackHrParamSchema, "params"), async (req, res) => {
    const { hrId } = req.params;
    try {
        const feedbacks = await prisma_1.default.feedback.findMany({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
router.get("/feedback/analytics", auth_1.auth, (0, auth_1.checkRole)(["ADMIN"]), async (_req, res) => {
    try {
        const result = await prisma_1.default.feedback.aggregate({
            _avg: {
                technicalKnowledge: true,
                serviceAndCoordination: true,
                communicationSkills: true,
                futureParticipation: true,
                punctualityAndInterest: true,
            },
        });
        res.json(result._avg);
    }
    catch (err) {
        res.status(500).send("Server Error");
    }
});
// ── POST /add-student ────────────────────────────────────────────────────────
router.post("/add-student", auth_1.auth, (0, auth_1.checkRole)(["ADMIN", "PIPELINE"]), async (req, res) => {
    const { name, register_number, department, resume_url, hr_id } = req.body;
    if (!name || !register_number || !hr_id) {
        return res.status(400).json({ message: "Name, Register Number, and HR are required." });
    }
    try {
        // Check if student already exists
        let student = await prisma_1.default.student.findUnique({
            where: { registerNumber: register_number },
        });
        if (student) {
            // Check if already assigned to this HR
            const existingAssignment = await prisma_1.default.hrAssignment.findFirst({
                where: { studentId: student.id, hrId: hr_id },
            });
            if (existingAssignment) {
                return res.status(400).json({ message: "Student is already assigned to this HR." });
            }
        }
        else {
            student = await prisma_1.default.student.create({
                data: {
                    name,
                    registerNumber: register_number,
                    department,
                    resumeUrl: resume_url,
                },
            });
        }
        // Get next order for this HR
        const lastAssignment = await prisma_1.default.hrAssignment.findFirst({
            where: { hrId: hr_id },
            orderBy: { order: "desc" },
        });
        const nextOrder = lastAssignment ? lastAssignment.order + 1 : 1;
        await prisma_1.default.hrAssignment.create({
            data: {
                hrId: hr_id,
                studentId: student.id,
                order: nextOrder,
            },
        });
        res.json({ message: "Student added and assigned successfully." });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
// ── DELETE /hr/:userId ───────────────────────────────────────────────────────
router.delete("/hr/:userId", auth_1.auth, (0, auth_1.checkRole)(["ADMIN"]), async (req, res) => {
    const userId = req.params.userId;
    try {
        await prisma_1.default.$transaction(async (tx) => {
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete HR" });
    }
});
// ── DELETE /volunteer/:userId ────────────────────────────────────────────────
router.delete("/volunteer/:userId", auth_1.auth, (0, auth_1.checkRole)(["ADMIN"]), async (req, res) => {
    const userId = req.params.userId;
    try {
        await prisma_1.default.$transaction(async (tx) => {
            // Delete volunteer profile (cascades to user via schema)
            await tx.volunteerProfile.delete({ where: { id: userId } });
            // Delete user
            await tx.user.delete({ where: { id: userId } });
        });
        res.json({ message: "Volunteer deleted successfully" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete volunteer" });
    }
});
exports.default = router;
openapi_1.registry.registerPath({
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
openapi_1.registry.registerPath({
    method: "get",
    path: "/api/admin/feedback/{hrId}",
    tags: ["Admin"],
    security: [{ bearerAuth: [] }],
    description: "Get feedback submitted by a specific HR",
    request: {
        params: schemas_3.FeedbackHrParamSchema,
    },
    responses: {
        200: {
            description: "Feedback retrieved successfully",
        },
    },
});
openapi_1.registry.registerPath({
    method: "post",
    path: "/api/admin/register/hr",
    tags: ["Admin"],
    description: "Register a new HR",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: schemas_1.AdminRegisterHrSchema,
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
openapi_1.registry.registerPath({
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
openapi_1.registry.registerPath({
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
openapi_1.registry.registerPath({
    method: "get",
    path: "/api/admin/students",
    tags: ["Admin"],
    security: adminSecurity,
    description: "Search students by register number or name",
    request: {
        query: schemas_1.StudentSearchQuerySchema,
    },
    responses: {
        200: {
            description: "Students search result",
        },
    },
});
openapi_1.registry.registerPath({
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
openapi_1.registry.registerPath({
    method: "get",
    path: "/api/admin/hrs/{hrId}/students",
    tags: ["Admin"],
    security: adminSecurity,
    description: "Get students assigned to a specific HR",
    request: {
        params: schemas_1.HrIdParamSchema,
    },
    responses: {
        200: {
            description: "Students for HR retrieved",
        },
    },
});
openapi_1.registry.registerPath({
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
openapi_1.registry.registerPath({
    method: "post",
    path: "/api/admin/students/transfer",
    tags: ["Admin"],
    security: adminSecurity,
    description: "Transfer students to another HR",
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
            description: "Transfer successful",
        },
    },
});
openapi_1.registry.registerPath({
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
openapi_1.registry.registerPath({
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
openapi_1.registry.registerPath({
    method: "post",
    path: "/api/admin/register/hr",
    tags: ["Admin"],
    security: adminSecurity,
    description: "Register a new HR",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: schemas_1.AdminRegisterHrSchema,
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
openapi_1.registry.registerPath({
    method: "post",
    path: "/api/admin/register/volunteer",
    tags: ["Admin"],
    security: adminSecurity,
    description: "Register a new Volunteer",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: schemas_1.AdminRegisterVolunteerSchema,
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
openapi_1.registry.registerPath({
    method: "post",
    path: "/api/admin/reset-password/{userId}",
    tags: ["Admin"],
    security: adminSecurity,
    description: "Reset a user's password and generate a temporary password",
    request: {
        params: schemas_2.UserIdParamSchema,
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

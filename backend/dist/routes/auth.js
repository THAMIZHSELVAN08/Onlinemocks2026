"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const dotenv_1 = __importDefault(require("dotenv"));
const openapi_1 = require("../openapi");
const schemas_1 = require("../schemas");
dotenv_1.default.config();
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
}
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET;
// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { username },
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            username: user.username,
            role: user.role,
        }, JWT_SECRET, { expiresIn: "24h" });
        const userData = {
            id: user.id,
            username: user.username,
            role: user.role,
        };
        if (user.role === "STUDENT") {
            const student = await prisma_1.default.student.findUnique({
                where: { id: user.id },
                include: {
                    assignments: {
                        where: { status: "PENDING" },
                        orderBy: { assignedAt: "desc" },
                        take: 1,
                    },
                },
            });
            if (student) {
                userData.name = student.name;
                userData.current_hr_id = student.assignments[0]?.hrId || null;
            }
        }
        else if (user.role === "HR") {
            const hr = await prisma_1.default.hrProfile.findUnique({ where: { id: user.id } });
            if (hr)
                userData.name = hr.name;
        }
        else if (user.role === "VOLUNTEER") {
            const vol = await prisma_1.default.volunteerProfile.findUnique({
                where: { id: user.id },
            });
            if (vol)
                userData.name = vol.name;
        }
        res.json({
            token,
            user: userData,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
openapi_1.registry.registerPath({
    method: "post",
    path: "/api/auth/login",
    tags: ["Auth"],
    description: "Authenticate user and return JWT token",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: schemas_1.LoginSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: "Login successful",
            content: {
                "application/json": {
                    schema: schemas_1.AuthResponseSchema,
                },
            },
        },
        400: {
            description: "Invalid credentials",
        },
    },
});
exports.default = router;

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import dotenv from "dotenv";
import { registry } from "../openapi";
import { LoginSchema, AuthResponseSchema } from "../schemas";

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET not defined");
}

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    const userData: any = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
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
    } else if (user.role === "HR") {
      const hr = await prisma.hrProfile.findUnique({ where: { id: user.id } });
      if (hr) userData.name = hr.name;
    } else if (user.role === "VOLUNTEER") {
      const vol = await prisma.volunteerProfile.findUnique({
        where: { id: user.id },
      });
      if (vol) userData.name = vol.name;
    }

    res.json({
      token,
      user: userData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  tags: ["Auth"],
  description: "Authenticate user and return JWT token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": {
          schema: AuthResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid credentials",
    },
  },
});
export default router;

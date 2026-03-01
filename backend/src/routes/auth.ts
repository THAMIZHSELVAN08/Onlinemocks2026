import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import dotenv from "dotenv";

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
    // Optional hardcoded admin
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        {
          id: "00000000-0000-0000-0000-000000000000",
          username: "admin",
          role: "ADMIN",
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      return res.json({
        token,
        user: {
          id: "00000000-0000-0000-0000-000000000000",
          username: "admin",
          role: "ADMIN",
        },
      });
    }

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
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

export default router;

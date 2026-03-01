import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";
import { InterviewStatus, Role } from "@prisma/client";

async function main() {
  console.log("🌱 Seeding database...");

  // Clean everything first (order matters)
  // await prisma.notification.deleteMany();
  // await prisma.studentTransfer.deleteMany();
  // await prisma.evaluation.deleteMany();
  // await prisma.hrAssignment.deleteMany();
  // await prisma.volunteerProfile.deleteMany();
  // await prisma.hrProfile.deleteMany();
  // await prisma.student.deleteMany();
  // await prisma.user.deleteMany();

  // ─────────────────────────────────────────
  // Admin
  // ─────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  // ─────────────────────────────────────────
  // HRs
  // ─────────────────────────────────────────
  const hrs = [];

  for (let i = 1; i <= 3; i++) {
    const passwordHash = await bcrypt.hash(`hr${i}pass`, 10);

    const user = await prisma.user.create({
      data: {
        username: `hr${i}`,
        passwordHash,
        role: Role.HR,
        hrProfile: {
          create: {
            name: `HR ${i}`,
            companyName: `Company ${i}`,
          },
        },
      },
      include: { hrProfile: true },
    });

    hrs.push(user);
  }

  // ─────────────────────────────────────────
  // Volunteers
  // ─────────────────────────────────────────
  for (let i = 1; i <= 3; i++) {
    const passwordHash = await bcrypt.hash(`vol${i}pass`, 10);

    await prisma.user.create({
      data: {
        username: `vol${i}`,
        passwordHash,
        role: Role.VOLUNTEER,
        volunteerProfile: {
          create: {
            name: `Volunteer ${i}`,
            assignedHrId: hrs[i - 1].id,
          },
        },
      },
    });
  }

  // ─────────────────────────────────────────
  // Students + Assignments
  // ─────────────────────────────────────────
  const students = [];

  for (let i = 1; i <= 20; i++) {
    const student = await prisma.student.create({
      data: {
        name: `Student ${i}`,
        registerNumber: `REG2026${i.toString().padStart(3, "0")}`,
        department: "CSE",
        section: "A",
        aptitudeScore: Math.floor(Math.random() * 100),
        gdScore: Math.floor(Math.random() * 100),
      },
    });

    students.push(student);
  }

  // Assign evenly across HRs
  let orderMap: Record<number, number> = {
    0: 1,
    1: 1,
    2: 1,
  };
  for (let i = 0; i < students.length; i++) {
    const hrIndex = i % 3;

    await prisma.hrAssignment.create({
      data: {
        hrId: hrs[hrIndex].id,
        studentId: students[i].id,
        order: orderMap[hrIndex],
        status:
          i % 5 === 0
            ? InterviewStatus.COMPLETED
            : i % 7 === 0
              ? InterviewStatus.NO_SHOW
              : InterviewStatus.PENDING,
      },
    });

    orderMap[hrIndex]++;
  }

  // ─────────────────────────────────────────
  // Some Evaluations
  // ─────────────────────────────────────────
  const completedAssignments = await prisma.hrAssignment.findMany({
    where: { status: InterviewStatus.COMPLETED },
  });

  for (const assignment of completedAssignments) {
    await prisma.evaluation.create({
      data: {
        studentId: assignment.studentId,
        hrId: assignment.hrId,
        appearanceAttitude: 8,
        managerialAptitude: 7,
        generalAwareness: 6,
        technicalKnowledge: 8,
        communicationSkills: 7,
        ambition: 8,
        selfConfidence: 7,
        strengths: "Good problem solving",
        improvements: "Needs confidence boost",
        comments: "Promising candidate",
        overallScore: 7.5,
      },
    });
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

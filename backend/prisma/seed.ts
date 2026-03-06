import { PrismaClient, Role, InterviewStatus, Student } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("Cleaning database...");

  await prisma.feedback.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.hrAssignment.deleteMany();
  await prisma.studentTransfer.deleteMany();
  await prisma.student.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.hrProfile.deleteMany();
  await prisma.pipelineProfile.deleteMany();
  await prisma.user.deleteMany();

  /*
  =========================
  ADMIN
  =========================
  */

  console.log("Seeding Admin...");

  const adminHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      id: "00000000-0000-0000-0000-000000000000",
      username: "admin",
      passwordHash: adminHash,
      plainPassword: "admin123",
      role: Role.ADMIN,
    },
  });

  /*
  =========================
  HRs
  =========================
  */

  console.log("Seeding HRs...");

  const hrNames = [
    "Rajesh Kumar",
    "Ananya Singh",
    "Suresh Raina",
    "Meera Nair",
    "Vikram Rathore",
  ];

  const hrCompanies = [
    "TechCorp",
    "Innovate Solutions",
    "DataFlow Inc",
    "Global HR",
    "NexGen Systems",
  ];

  const hrIds: string[] = [];

  for (let i = 0; i < hrNames.length; i++) {
    const username = `hr${i + 1}`;
    const password = "hr123";
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hash,
        plainPassword: password,
        role: Role.HR,
        hrProfile: {
          create: {
            name: hrNames[i],
            companyName: hrCompanies[i],
          },
        },
      },
    });

    hrIds.push(user.id);
  }

  /*
  =========================
  VOLUNTEERS
  =========================
  */

  console.log("Seeding Volunteers...");

  for (let i = 1; i <= 10; i++) {
    const username = `volunteer${i}`;
    const password = "vol123";

    const hash = await bcrypt.hash(password, 10);

    const assignedHr = hrIds[Math.floor(Math.random() * hrIds.length)];

    await prisma.user.create({
      data: {
        username,
        passwordHash: hash,
        plainPassword: password,
        role: Role.VOLUNTEER,
        volunteerProfile: {
          create: {
            name: `Volunteer ${i}`,
            assignedHrId: assignedHr,
          },
        },
      },
    });
  }

  /*
  =========================
  STUDENTS
  =========================
  */

  console.log("Seeding Students...");

  const depts = ["CSE", "ECE", "EEE", "MECH", "IT", "BIO-TECH"];
  const sections = ["A", "B", "C"];

  const students: Student[] = [];

  for (let i = 1; i <= 50; i++) {
    const regNum = `2127230601${String(100 + i)}`;

    const student = await prisma.student.create({
      data: {
        name: `Student ${i}`,
        registerNumber: regNum,
        department: depts[Math.floor(Math.random() * depts.length)],
        section: sections[Math.floor(Math.random() * sections.length)],
        aptitudeScore: Math.floor(Math.random() * 50) + 40,
        gdScore: Math.floor(Math.random() * 50) + 40,
      },
    });

    students.push(student);
  } /*
  =========================
  HR ASSIGNMENTS
  =========================
  */

  console.log("Assigning students to HRs...");

  let orderMap: Record<string, number> = {};

  for (const hrId of hrIds) {
    orderMap[hrId] = 1;
  }

  for (const student of students) {
    const hrId = hrIds[Math.floor(Math.random() * hrIds.length)];

    await prisma.hrAssignment.create({
      data: {
        hrId,
        studentId: student.id,
        order: orderMap[hrId],
        status: InterviewStatus.PENDING,
      },
    });

    orderMap[hrId]++;
  }

  /*
  =========================
  SAMPLE FEEDBACK
  =========================
  */

  console.log("Creating sample feedback...");

  for (const hrId of hrIds) {
    await prisma.feedback.create({
      data: {
        hrId,
        technicalKnowledge: Math.floor(Math.random() * 10) + 1,
        serviceAndCoordination: Math.floor(Math.random() * 10) + 1,
        communicationSkills: Math.floor(Math.random() * 10) + 1,
        futureParticipation: Math.floor(Math.random() * 10) + 1,
        punctualityAndInterest: Math.floor(Math.random() * 10) + 1,
        suggestions: "Good interview coordination overall.",
        issuesFaced: "Minor scheduling delays.",
        improvementSuggestions: "Better queue management.",
      },
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

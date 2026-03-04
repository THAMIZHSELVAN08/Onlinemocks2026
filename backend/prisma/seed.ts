import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";
import { InterviewStatus, Role } from "@prisma/client";

async function main() {
  console.log("🌱 Seeding database...");

  // Clean everything first (order matters)
  await prisma.notification.deleteMany();
  await prisma.studentTransfer.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.hrAssignment.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.hrProfile.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

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
  const hrNames = ["Rajesh Kumar", "Alex", "Meera Nair", "selvan"];
  const hrCompanies = ["TechCorp", "Innovate Solutions", "DataFlow Inc", "Innovate Solutions"];

  for (let i = 0; i < hrNames.length; i++) {
    const username = hrNames[i] === "selvan" ? "selvan" : hrNames[i].toLowerCase().split(' ')[0];
    const passwordHash = await bcrypt.hash(username === "selvan" ? "selvan123" : `${username}123`, 10);

    const user = await prisma.user.create({
      data: {
        username: username,
        passwordHash,
        role: Role.HR,
        hrProfile: {
          create: {
            name: hrNames[i],
            companyName: hrCompanies[i],
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



  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

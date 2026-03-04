import prisma from "./src/lib/prisma";

async function main() {
  const assignments = await prisma.hrAssignment.findMany({
    include: {
      hr: { include: { hrProfile: true } },
      student: true
    }
  });

  console.log("Current Assignments:");
  assignments.forEach(a => {
    console.log(`Student: ${a.student.name} (${a.student.registerNumber}) -> HR: ${a.hr.hrProfile?.name} (Order: ${a.order})`);
  });

  const hrs = await prisma.user.findMany({
    where: { role: "HR" },
    include: { hrProfile: true }
  });
  console.log("\nAll HRs:");
  hrs.forEach(h => {
    console.log(`HR: ${h.hrProfile?.name} (ID: ${h.id}, Username: ${h.username})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

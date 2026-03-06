import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const studentsCount = await prisma.student.count();
  const hrCount = await prisma.hrProfile.count();
  const volCount = await prisma.volunteerProfile.count();
  console.log({ studentsCount, hrCount, volCount });
  await prisma.$disconnect();
}

main();

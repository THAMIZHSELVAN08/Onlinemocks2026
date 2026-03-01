/*
  Warnings:

  - You are about to drop the `HrVolunteer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "HrVolunteer" DROP CONSTRAINT "HrVolunteer_hrId_fkey";

-- DropForeignKey
ALTER TABLE "HrVolunteer" DROP CONSTRAINT "HrVolunteer_volunteerId_fkey";

-- DropTable
DROP TABLE "HrVolunteer";

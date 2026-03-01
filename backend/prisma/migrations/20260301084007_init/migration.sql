-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HR', 'VOLUNTEER', 'PIPELINE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRANSFER', 'EVALUATION', 'GENERAL');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "registerNumber" TEXT NOT NULL,
    "department" TEXT,
    "section" TEXT,
    "resumeUrl" TEXT,
    "aptitudeScore" INTEGER NOT NULL DEFAULT 0,
    "gdScore" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_profiles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255),
    "company_name" VARCHAR(255),

    CONSTRAINT "hr_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrVolunteer" (
    "id" SERIAL NOT NULL,
    "hrId" UUID NOT NULL,
    "volunteerId" UUID NOT NULL,

    CONSTRAINT "HrVolunteer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_profiles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255),
    "assigned_hr_id" UUID,

    CONSTRAINT "volunteer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrAssignment" (
    "id" SERIAL NOT NULL,
    "hrId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" SERIAL NOT NULL,
    "studentId" UUID NOT NULL,
    "hrId" UUID NOT NULL,
    "appearance_attitude" INTEGER NOT NULL DEFAULT 0,
    "managerial_aptitude" INTEGER NOT NULL DEFAULT 0,
    "general_awareness" INTEGER NOT NULL DEFAULT 0,
    "technical_knowledge" INTEGER NOT NULL DEFAULT 0,
    "communication_skills" INTEGER NOT NULL DEFAULT 0,
    "ambition" INTEGER NOT NULL DEFAULT 0,
    "self_confidence" INTEGER NOT NULL DEFAULT 0,
    "strengths" TEXT,
    "improvements" TEXT,
    "comments" TEXT,
    "overall_score" DECIMAL(4,2),
    "evaluation_date" DATE DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_transfers" (
    "id" SERIAL NOT NULL,
    "student_id" UUID NOT NULL,
    "from_hr_id" UUID,
    "to_hr_id" UUID,
    "admin_id" UUID,
    "transfer_reason" TEXT,
    "transferred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Student_registerNumber_key" ON "Student"("registerNumber");

-- CreateIndex
CREATE INDEX "HrVolunteer_hrId_idx" ON "HrVolunteer"("hrId");

-- CreateIndex
CREATE UNIQUE INDEX "HrVolunteer_hrId_volunteerId_key" ON "HrVolunteer"("hrId", "volunteerId");

-- CreateIndex
CREATE INDEX "HrAssignment_hrId_idx" ON "HrAssignment"("hrId");

-- CreateIndex
CREATE INDEX "HrAssignment_studentId_idx" ON "HrAssignment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "HrAssignment_hrId_order_key" ON "HrAssignment"("hrId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_studentId_hrId_key" ON "evaluations"("studentId", "hrId");

-- AddForeignKey
ALTER TABLE "hr_profiles" ADD CONSTRAINT "hr_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrVolunteer" ADD CONSTRAINT "HrVolunteer_hrId_fkey" FOREIGN KEY ("hrId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrVolunteer" ADD CONSTRAINT "HrVolunteer_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_assigned_hr_id_fkey" FOREIGN KEY ("assigned_hr_id") REFERENCES "hr_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrAssignment" ADD CONSTRAINT "HrAssignment_hrId_fkey" FOREIGN KEY ("hrId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrAssignment" ADD CONSTRAINT "HrAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_hrId_fkey" FOREIGN KEY ("hrId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_transfers" ADD CONSTRAINT "student_transfers_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_transfers" ADD CONSTRAINT "student_transfers_from_hr_id_fkey" FOREIGN KEY ("from_hr_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_transfers" ADD CONSTRAINT "student_transfers_to_hr_id_fkey" FOREIGN KEY ("to_hr_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_transfers" ADD CONSTRAINT "student_transfers_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

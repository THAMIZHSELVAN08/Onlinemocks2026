-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'STUDENT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plain_password" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "pipeline_profiles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "pipeline_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_feedbacks" (
    "id" SERIAL NOT NULL,
    "volunteer_id" UUID NOT NULL,
    "clarity_of_instructions" INTEGER NOT NULL,
    "hr_cooperation" INTEGER NOT NULL,
    "organization_of_schedule" INTEGER NOT NULL,
    "software_ease" INTEGER NOT NULL,
    "workload_management" INTEGER NOT NULL,
    "overall_experience" INTEGER NOT NULL,
    "issues_faced" TEXT,
    "improvement_suggestions" TEXT,
    "additional_comments" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteer_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "volunteer_feedbacks_volunteer_id_idx" ON "volunteer_feedbacks"("volunteer_id");

-- AddForeignKey
ALTER TABLE "pipeline_profiles" ADD CONSTRAINT "pipeline_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_feedbacks" ADD CONSTRAINT "volunteer_feedbacks_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

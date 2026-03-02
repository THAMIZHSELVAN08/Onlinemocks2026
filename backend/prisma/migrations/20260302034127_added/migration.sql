-- CreateTable
CREATE TABLE "feedbacks" (
    "id" SERIAL NOT NULL,
    "hrId" UUID NOT NULL,
    "technicalKnowledge" INTEGER NOT NULL,
    "service_and_coordination" INTEGER NOT NULL,
    "communication_skills" INTEGER NOT NULL,
    "future_participation" INTEGER NOT NULL,
    "punctuality_and_interest" INTEGER NOT NULL,
    "suggestions" TEXT,
    "issues_faced" TEXT,
    "improvement_suggestions" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedbacks_hrId_idx" ON "feedbacks"("hrId");

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_hrId_fkey" FOREIGN KEY ("hrId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "PersonalDataAction" AS ENUM ('VIEW_REGISTRY', 'VIEW_MEMBER_DETAIL', 'VIEW_APPLICATION', 'VIEW_SSN', 'EXPORT_CSV', 'VIEW_PROXY_DETAILS', 'VIEW_ORGANIZATION_REPS');

-- CreateTable
CREATE TABLE "PersonalDataAccessLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "PersonalDataAction" NOT NULL,
    "targetUserId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalDataAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalDataAccessLog_userId_idx" ON "PersonalDataAccessLog"("userId");

-- CreateIndex
CREATE INDEX "PersonalDataAccessLog_targetUserId_idx" ON "PersonalDataAccessLog"("targetUserId");

-- CreateIndex
CREATE INDEX "PersonalDataAccessLog_createdAt_idx" ON "PersonalDataAccessLog"("createdAt");

-- CreateEnum
CREATE TYPE "NominationPeriodStatus" AS ENUM ('PLANNING', 'OPEN', 'CLOSED', 'PRESENTED');

-- CreateEnum
CREATE TYPE "NominationPosition" AS ENUM ('CHAIRPERSON', 'BOARD_MEMBER', 'BOARD_SUBSTITUTE', 'AUDITOR', 'AUDITOR_SUBSTITUTE');

-- CreateEnum
CREATE TYPE "NominationStatus" AS ENUM ('PROPOSED', 'CONTACTED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'ELECTED', 'NOT_ELECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AgendaItemType" ADD VALUE 'AUDIT_REPORT';
ALTER TYPE "AgendaItemType" ADD VALUE 'DISCHARGE_VOTE';
ALTER TYPE "AgendaItemType" ADD VALUE 'BOARD_ELECTION';
ALTER TYPE "AgendaItemType" ADD VALUE 'SUBSTITUTE_ELECTION';
ALTER TYPE "AgendaItemType" ADD VALUE 'AUDITOR_ELECTION';
ALTER TYPE "AgendaItemType" ADD VALUE 'ELECT_NOMINATING_COMMITTEE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'AUDITOR_SUBSTITUTE';
ALTER TYPE "Role" ADD VALUE 'NOMINATING_COMMITTEE';
ALTER TYPE "Role" ADD VALUE 'NOMINATING_COMMITTEE_CHAIR';

-- AlterTable
ALTER TABLE "BrfRules" ADD COLUMN     "allowMemberNomination" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowSelfNomination" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nominatingCommitteeSize" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "nominationDeadlineBeforeMeeting" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "nominationPeriodWeeks" INTEGER NOT NULL DEFAULT 8;

-- CreateTable
CREATE TABLE "NominationPeriod" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "status" "NominationPeriodStatus" NOT NULL DEFAULT 'PLANNING',
    "chairpersonId" TEXT,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "presentedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NominationPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nomination" (
    "id" TEXT NOT NULL,
    "nominationPeriodId" TEXT NOT NULL,
    "position" "NominationPosition" NOT NULL,
    "candidateId" TEXT,
    "candidateName" TEXT NOT NULL,
    "status" "NominationStatus" NOT NULL DEFAULT 'PROPOSED',
    "source" TEXT NOT NULL DEFAULT 'COMMITTEE',
    "motivation" TEXT,
    "competenceAreas" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "declinedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberNomination" (
    "id" TEXT NOT NULL,
    "nominationPeriodId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "candidateId" TEXT,
    "candidateName" TEXT,
    "position" "NominationPosition" NOT NULL,
    "motivation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberNomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConflictOfInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "relatedEntity" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "ConflictOfInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditQuestion" (
    "id" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "subject" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answeredById" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NominationPeriod_meetingId_key" ON "NominationPeriod"("meetingId");

-- CreateIndex
CREATE INDEX "Nomination_nominationPeriodId_idx" ON "Nomination"("nominationPeriodId");

-- CreateIndex
CREATE INDEX "Nomination_position_idx" ON "Nomination"("position");

-- CreateIndex
CREATE INDEX "MemberNomination_nominationPeriodId_idx" ON "MemberNomination"("nominationPeriodId");

-- CreateIndex
CREATE INDEX "ConflictOfInterest_userId_idx" ON "ConflictOfInterest"("userId");

-- CreateIndex
CREATE INDEX "AuditQuestion_auditorId_idx" ON "AuditQuestion"("auditorId");

-- AddForeignKey
ALTER TABLE "NominationPeriod" ADD CONSTRAINT "NominationPeriod_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nomination" ADD CONSTRAINT "Nomination_nominationPeriodId_fkey" FOREIGN KEY ("nominationPeriodId") REFERENCES "NominationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberNomination" ADD CONSTRAINT "MemberNomination_nominationPeriodId_fkey" FOREIGN KEY ("nominationPeriodId") REFERENCES "NominationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConflictOfInterest" ADD CONSTRAINT "ConflictOfInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditQuestion" ADD CONSTRAINT "AuditQuestion_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

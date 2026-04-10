-- CreateEnum
CREATE TYPE "MotionRecommendation" AS ENUM ('APPROVE', 'REJECT', 'AMEND', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "MotionProposalSource" AS ENUM ('MOTIONER', 'BOARD', 'AMENDMENT');

-- CreateEnum
CREATE TYPE "OrganizationAffiliation" AS ENUM ('NONE', 'HSB', 'RIKSBYGGEN', 'SBC', 'OTHER');

-- AlterTable
ALTER TABLE "Motion" ADD COLUMN     "boardRecommendation" "MotionRecommendation";

-- CreateTable
CREATE TABLE "MotionVoteProposal" (
    "id" TEXT NOT NULL,
    "motionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "source" "MotionProposalSource" NOT NULL DEFAULT 'MOTIONER',
    "votesFor" INTEGER,
    "votesAgainst" INTEGER,
    "votesAbstained" INTEGER,
    "adopted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MotionVoteProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrfRules" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "affiliation" "OrganizationAffiliation" NOT NULL DEFAULT 'NONE',
    "reservedBoardSeats" INTEGER NOT NULL DEFAULT 0,
    "reservedBoardSubstitutes" INTEGER NOT NULL DEFAULT 0,
    "reservedAuditorSeats" INTEGER NOT NULL DEFAULT 0,
    "requireOrgApprovalForStatuteChange" BOOLEAN NOT NULL DEFAULT false,
    "minBoardMembers" INTEGER NOT NULL DEFAULT 3,
    "maxBoardMembers" INTEGER NOT NULL DEFAULT 7,
    "maxBoardSubstitutes" INTEGER NOT NULL DEFAULT 3,
    "allowExternalBoardMembers" INTEGER NOT NULL DEFAULT 0,
    "noticePeriodMinWeeks" INTEGER NOT NULL DEFAULT 2,
    "noticePeriodMaxWeeks" INTEGER NOT NULL DEFAULT 6,
    "noticeMethodDigital" BOOLEAN NOT NULL DEFAULT false,
    "allowDigitalMeeting" BOOLEAN NOT NULL DEFAULT false,
    "maxProxiesPerPerson" INTEGER NOT NULL DEFAULT 1,
    "proxyCircleRestriction" BOOLEAN NOT NULL DEFAULT false,
    "proxyMaxValidityMonths" INTEGER NOT NULL DEFAULT 12,
    "blankVoteExcluded" BOOLEAN NOT NULL DEFAULT true,
    "secretBallotOnDemand" BOOLEAN NOT NULL DEFAULT true,
    "tieBreakerChairperson" BOOLEAN NOT NULL DEFAULT true,
    "tieBreakerLotteryForElection" BOOLEAN NOT NULL DEFAULT true,
    "adjustersCount" INTEGER NOT NULL DEFAULT 2,
    "separateVoteCounters" BOOLEAN NOT NULL DEFAULT false,
    "agendaTemplateId" TEXT,
    "motionDeadlineMonth" INTEGER NOT NULL DEFAULT 2,
    "motionDeadlineDay" INTEGER NOT NULL DEFAULT 1,
    "transferFeeMaxPercent" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "pledgeFeeMaxPercent" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "subletFeeMaxPercent" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "transferFeePaidBySeller" BOOLEAN NOT NULL DEFAULT false,
    "minAuditors" INTEGER NOT NULL DEFAULT 1,
    "maxAuditors" INTEGER NOT NULL DEFAULT 2,
    "maxAuditorSubstitutes" INTEGER NOT NULL DEFAULT 2,
    "requireAuthorizedAuditor" BOOLEAN NOT NULL DEFAULT false,
    "maintenancePlanRequired" BOOLEAN NOT NULL DEFAULT true,
    "maintenancePlanYears" INTEGER NOT NULL DEFAULT 30,
    "maintenanceFundPercent" DOUBLE PRECISION,
    "protocolDeadlineWeeks" INTEGER NOT NULL DEFAULT 3,
    "maxOwnershipPercent" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "subletRequiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrfRules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MotionVoteProposal_motionId_idx" ON "MotionVoteProposal"("motionId");

-- AddForeignKey
ALTER TABLE "MotionVoteProposal" ADD CONSTRAINT "MotionVoteProposal_motionId_fkey" FOREIGN KEY ("motionId") REFERENCES "Motion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

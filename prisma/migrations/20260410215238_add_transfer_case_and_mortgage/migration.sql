-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('SALE', 'PRIVATE_SALE', 'INHERITANCE', 'DIVORCE_SETTLEMENT', 'GIFT', 'FORCED_SALE', 'SHARE_CHANGE');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('INITIATED', 'MEMBERSHIP_REVIEW', 'APPROVED', 'REJECTED', 'APPEALED', 'FINANCIAL_SETTLEMENT', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "BrfRules" ADD COLUMN     "prisbasbelopp" INTEGER NOT NULL DEFAULT 57300,
ADD COLUMN     "transferDecisionDeadlineWeeks" INTEGER NOT NULL DEFAULT 4;

-- CreateTable
CREATE TABLE "TransferCase" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "type" "TransferType" NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'INITIATED',
    "sellerId" TEXT,
    "buyerApplicationId" TEXT,
    "externalContactName" TEXT,
    "externalContactEmail" TEXT,
    "externalContactPhone" TEXT,
    "transferPrice" DOUBLE PRECISION,
    "transferFeeAmount" DOUBLE PRECISION,
    "transferFeePaidBy" TEXT,
    "transferFeePaidAt" TIMESTAMP(3),
    "pledgeFeeAmount" DOUBLE PRECISION,
    "outstandingDebt" DOUBLE PRECISION,
    "contractDate" TIMESTAMP(3),
    "accessDate" TIMESTAMP(3),
    "decisionDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "creditCheckDone" BOOLEAN NOT NULL DEFAULT false,
    "creditCheckDate" TIMESTAMP(3),
    "financingVerified" BOOLEAN NOT NULL DEFAULT false,
    "financingVerifiedDate" TIMESTAMP(3),
    "statuteCheckDone" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "decisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "TransferCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MortgageNotation" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "transferCaseId" TEXT,
    "bankName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "notationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "denotationDate" TIMESTAMP(3),
    "fee" DOUBLE PRECISION,
    "feePaidAt" TIMESTAMP(3),
    "requestedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MortgageNotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransferCase_buyerApplicationId_key" ON "TransferCase"("buyerApplicationId");

-- CreateIndex
CREATE INDEX "TransferCase_apartmentId_idx" ON "TransferCase"("apartmentId");

-- CreateIndex
CREATE INDEX "TransferCase_status_idx" ON "TransferCase"("status");

-- CreateIndex
CREATE INDEX "TransferCase_sellerId_idx" ON "TransferCase"("sellerId");

-- CreateIndex
CREATE INDEX "MortgageNotation_apartmentId_idx" ON "MortgageNotation"("apartmentId");

-- CreateIndex
CREATE INDEX "MortgageNotation_transferCaseId_idx" ON "MortgageNotation"("transferCaseId");

-- AddForeignKey
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_buyerApplicationId_fkey" FOREIGN KEY ("buyerApplicationId") REFERENCES "MembershipApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferCase" ADD CONSTRAINT "TransferCase_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MortgageNotation" ADD CONSTRAINT "MortgageNotation_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MortgageNotation" ADD CONSTRAINT "MortgageNotation_transferCaseId_fkey" FOREIGN KEY ("transferCaseId") REFERENCES "TransferCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MortgageNotation" ADD CONSTRAINT "MortgageNotation_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

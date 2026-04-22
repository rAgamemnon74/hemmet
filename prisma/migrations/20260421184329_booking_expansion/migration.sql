-- CreateEnum
CREATE TYPE "ResourceBookingMode" AS ENUM ('FREEFORM', 'SLOTS', 'DAYS');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RENEWAL_PENDING', 'EXPIRING', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ContractCategory" AS ENUM ('SERVICE', 'INSURANCE', 'FINANCIAL', 'MANAGEMENT', 'UTILITY', 'PROJECT', 'CONSULTING', 'OTHER');

-- CreateEnum
CREATE TYPE "MandateLevel" AS ENUM ('DELEGATED', 'BOARD', 'ANNUAL_MEETING');

-- CreateEnum
CREATE TYPE "ProcurementStatus" AS ENUM ('NEED', 'NEED_DEFERRED', 'APPROVED', 'SPECIFICATION', 'RFQ_SENT', 'COLLECTING_QUOTES', 'EVALUATION', 'DECISION_PENDING', 'ORDERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProcurementCategory" AS ENUM ('PHYSICAL', 'SERVICE', 'IT_DIGITAL', 'FINANCIAL', 'INSURANCE', 'UTILITY');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'RECEIVED', 'SELECTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EgenkontrollStatus" AS ENUM ('DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EnvironmentalIncidentStatus" AS ENUM ('REPORTED', 'INVESTIGATING', 'REPORTED_TO_AUTHORITY', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "WastePlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ChemicalHazardClass" AS ENUM ('FLAMMABLE', 'TOXIC', 'CORROSIVE', 'OXIDIZING', 'ENVIRONMENTAL', 'HEALTH_HAZARD', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ResourceType" ADD VALUE 'CAR_WASH';
ALTER TYPE "ResourceType" ADD VALUE 'PARKING';
ALTER TYPE "ResourceType" ADD VALUE 'HOBBY_ROOM';

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- AlterTable
ALTER TABLE "BookableResource" ADD COLUMN     "bookingMode" "ResourceBookingMode" NOT NULL DEFAULT 'FREEFORM',
ADD COLUMN     "cancelLockHours" INTEGER,
ADD COLUMN     "closingHour" INTEGER,
ADD COLUMN     "groupLabel" TEXT,
ADD COLUMN     "maxActiveBookings" INTEGER,
ADD COLUMN     "maxBookingsPerPeriod" INTEGER,
ADD COLUMN     "maxConsecutiveUnits" INTEGER,
ADD COLUMN     "openingHour" INTEGER,
ADD COLUMN     "periodDays" INTEGER,
ADD COLUMN     "priorityWindowDays" INTEGER,
ADD COLUMN     "reducedAdvanceBookingDays" INTEGER;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "anonymizedAt" TIMESTAMP(3),
ADD COLUMN     "cancelLate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slotId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Contractor" ADD COLUMN     "bankgiro" TEXT,
ADD COLUMN     "bic" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'SE',
ADD COLUMN     "dunsNumber" TEXT,
ADD COLUMN     "fTax" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fTaxVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "insuranceCoverage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "insuranceExpiry" TIMESTAMP(3),
ADD COLUMN     "plusgiro" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "streetAddress" TEXT,
ADD COLUMN     "swish" TEXT,
ADD COLUMN     "vatNumber" TEXT,
ADD COLUMN     "vatRegistered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "ResourceSlot" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startHour" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL DEFAULT 0,
    "endHour" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionAttachment" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractorContact" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ContractorContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "category" "ContractCategory" NOT NULL,
    "contractorId" TEXT,
    "counterpartyName" TEXT NOT NULL,
    "counterpartyOrg" TEXT,
    "counterpartyEmail" TEXT,
    "counterpartyPhone" TEXT,
    "documentUrl" TEXT,
    "isFrameworkAgreement" BOOLEAN NOT NULL DEFAULT false,
    "annualCeiling" DECIMAL(12,2),
    "annualCost" DECIMAL(12,2),
    "totalValue" DECIMAL(12,2),
    "paymentTerms" TEXT,
    "paymentMethod" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "autoRenewal" BOOLEAN NOT NULL DEFAULT false,
    "renewalPeriodMonths" INTEGER,
    "noticePeriodMonths" INTEGER,
    "noticeDeadline" TIMESTAMP(3),
    "mandateLevel" "MandateLevel" NOT NULL DEFAULT 'BOARD',
    "decisionId" TEXT,
    "decisionRef" TEXT,
    "procurementId" TEXT,
    "warrantyMonths" INTEGER,
    "warrantyExpiry" TIMESTAMP(3),
    "pubAgreement" BOOLEAN NOT NULL DEFAULT false,
    "signedById" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractCallOff" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedCost" DECIMAL(12,2),
    "actualCost" DECIMAL(12,2),
    "damageReportId" TEXT,
    "inspectionId" TEXT,
    "expenseId" TEXT,
    "calledOffById" TEXT NOT NULL,
    "calledOffAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractCallOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procurement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "ProcurementCategory" NOT NULL DEFAULT 'PHYSICAL',
    "status" "ProcurementStatus" NOT NULL DEFAULT 'NEED',
    "urgency" TEXT,
    "estimatedCost" DECIMAL(12,2),
    "actualCost" DECIMAL(12,2),
    "isRecurringCost" BOOLEAN NOT NULL DEFAULT false,
    "annualEstimate" DECIMAL(12,2),
    "rfqSentAt" TIMESTAMP(3),
    "quotesDeadline" TIMESTAMP(3),
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "mandateLevel" "MandateLevel",
    "approvalDecisionId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "deferredCount" INTEGER NOT NULL DEFAULT 0,
    "rejectionReason" TEXT,
    "decisionId" TEXT,
    "decisionNote" TEXT,
    "selectedQuoteId" TEXT,
    "contractId" TEXT,
    "warrantyMonths" INTEGER,
    "warrantyExpiry" TIMESTAMP(3),
    "triggerType" TEXT,
    "triggerId" TEXT,
    "triggerTitle" TEXT,
    "ownerId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementQuote" (
    "id" TEXT NOT NULL,
    "procurementId" TEXT NOT NULL,
    "contractorId" TEXT,
    "companyName" TEXT NOT NULL,
    "orgNumber" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "amount" DECIMAL(12,2),
    "amountExVat" DECIMAL(12,2),
    "annualCost" DECIMAL(12,2),
    "validUntil" TIMESTAMP(3),
    "proposedStart" TIMESTAMP(3),
    "proposedEnd" TIMESTAMP(3),
    "contractLength" INTEGER,
    "noticePeriod" INTEGER,
    "warrantyMonths" INTEGER,
    "paymentTerms" TEXT,
    "paymentMethod" TEXT,
    "conditions" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcurementQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementNote" (
    "id" TEXT NOT NULL,
    "procurementId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcurementNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Egenkontroll" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "EgenkontrollStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "responsibilityDescription" TEXT,
    "riskAssessmentDescription" TEXT,
    "routinesDescription" TEXT,
    "chemicalInventoryNote" TEXT,
    "incidentRoutineNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "nextReviewDate" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Egenkontroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvironmentalRiskAssessment" (
    "id" TEXT NOT NULL,
    "egenkontrollId" TEXT,
    "buildingId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "area" TEXT,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "probability" INTEGER,
    "consequence" INTEGER,
    "existingMeasures" TEXT,
    "plannedMeasures" TEXT,
    "responsibleUserId" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReviewDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvironmentalRiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChemicalProduct" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "manufacturer" TEXT,
    "articleNumber" TEXT,
    "safetyDataSheetUrl" TEXT,
    "hazardClasses" "ChemicalHazardClass"[],
    "hazardStatements" TEXT,
    "riskPhrases" TEXT,
    "usageArea" TEXT,
    "storageLocation" TEXT,
    "annualQuantity" TEXT,
    "buildingId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastVerifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChemicalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteManagementPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "WastePlanStatus" NOT NULL DEFAULT 'DRAFT',
    "municipality" TEXT,
    "sortingStations" TEXT,
    "collectionSchedule" TEXT,
    "hazardousWasteRoutine" TEXT,
    "hazardousWasteContractorId" TEXT,
    "recyclingRoomLocation" TEXT,
    "recyclingRoomRules" TEXT,
    "lastAuditDate" TIMESTAMP(3),
    "nextAuditDate" TIMESTAMP(3),
    "notes" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WasteManagementPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvironmentalIncident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "EnvironmentalIncidentStatus" NOT NULL DEFAULT 'REPORTED',
    "incidentType" TEXT NOT NULL,
    "buildingId" TEXT,
    "location" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedToAuthorityAt" TIMESTAMP(3),
    "authorityName" TEXT,
    "authorityReference" TEXT,
    "immediateMeasures" TEXT,
    "followUpMeasures" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "reportedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvironmentalIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SustainabilityGoal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "unit" TEXT,
    "targetDate" TIMESTAMP(3),
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "achievedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SustainabilityGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceSlot_resourceId_dayOfWeek_idx" ON "ResourceSlot"("resourceId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "InspectionAttachment_inspectionId_idx" ON "InspectionAttachment"("inspectionId");

-- CreateIndex
CREATE INDEX "Attachment_entityType_entityId_idx" ON "Attachment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Attachment_uploadedById_idx" ON "Attachment"("uploadedById");

-- CreateIndex
CREATE INDEX "ContractorContact_contractorId_idx" ON "ContractorContact"("contractorId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_contractorId_idx" ON "Contract"("contractorId");

-- CreateIndex
CREATE INDEX "Contract_category_idx" ON "Contract"("category");

-- CreateIndex
CREATE INDEX "Contract_noticeDeadline_idx" ON "Contract"("noticeDeadline");

-- CreateIndex
CREATE INDEX "ContractCallOff_contractId_idx" ON "ContractCallOff"("contractId");

-- CreateIndex
CREATE INDEX "ContractCallOff_calledOffAt_idx" ON "ContractCallOff"("calledOffAt");

-- CreateIndex
CREATE INDEX "Procurement_status_idx" ON "Procurement"("status");

-- CreateIndex
CREATE INDEX "Procurement_category_idx" ON "Procurement"("category");

-- CreateIndex
CREATE INDEX "Procurement_ownerId_idx" ON "Procurement"("ownerId");

-- CreateIndex
CREATE INDEX "ProcurementQuote_procurementId_idx" ON "ProcurementQuote"("procurementId");

-- CreateIndex
CREATE INDEX "ProcurementNote_procurementId_idx" ON "ProcurementNote"("procurementId");

-- CreateIndex
CREATE INDEX "Egenkontroll_status_idx" ON "Egenkontroll"("status");

-- CreateIndex
CREATE INDEX "EnvironmentalRiskAssessment_egenkontrollId_idx" ON "EnvironmentalRiskAssessment"("egenkontrollId");

-- CreateIndex
CREATE INDEX "EnvironmentalRiskAssessment_riskLevel_idx" ON "EnvironmentalRiskAssessment"("riskLevel");

-- CreateIndex
CREATE INDEX "EnvironmentalRiskAssessment_buildingId_idx" ON "EnvironmentalRiskAssessment"("buildingId");

-- CreateIndex
CREATE INDEX "ChemicalProduct_buildingId_idx" ON "ChemicalProduct"("buildingId");

-- CreateIndex
CREATE INDEX "ChemicalProduct_active_idx" ON "ChemicalProduct"("active");

-- CreateIndex
CREATE INDEX "WasteManagementPlan_status_idx" ON "WasteManagementPlan"("status");

-- CreateIndex
CREATE INDEX "EnvironmentalIncident_status_idx" ON "EnvironmentalIncident"("status");

-- CreateIndex
CREATE INDEX "EnvironmentalIncident_buildingId_idx" ON "EnvironmentalIncident"("buildingId");

-- CreateIndex
CREATE INDEX "EnvironmentalIncident_incidentType_idx" ON "EnvironmentalIncident"("incidentType");

-- CreateIndex
CREATE INDEX "SustainabilityGoal_category_idx" ON "SustainabilityGoal"("category");

-- CreateIndex
CREATE INDEX "SustainabilityGoal_achieved_idx" ON "SustainabilityGoal"("achieved");

-- CreateIndex
CREATE INDEX "Booking_slotId_idx" ON "Booking"("slotId");

-- CreateIndex
CREATE INDEX "Contractor_orgNumber_idx" ON "Contractor"("orgNumber");

-- AddForeignKey
ALTER TABLE "ResourceSlot" ADD CONSTRAINT "ResourceSlot_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "BookableResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ResourceSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionAttachment" ADD CONSTRAINT "InspectionAttachment_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorContact" ADD CONSTRAINT "ContractorContact_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractCallOff" ADD CONSTRAINT "ContractCallOff_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractCallOff" ADD CONSTRAINT "ContractCallOff_calledOffById_fkey" FOREIGN KEY ("calledOffById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procurement" ADD CONSTRAINT "Procurement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procurement" ADD CONSTRAINT "Procurement_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementQuote" ADD CONSTRAINT "ProcurementQuote_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "Procurement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementQuote" ADD CONSTRAINT "ProcurementQuote_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementNote" ADD CONSTRAINT "ProcurementNote_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "Procurement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementNote" ADD CONSTRAINT "ProcurementNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvironmentalRiskAssessment" ADD CONSTRAINT "EnvironmentalRiskAssessment_egenkontrollId_fkey" FOREIGN KEY ("egenkontrollId") REFERENCES "Egenkontroll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "SubletStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "RenovationStatus" AS ENUM ('SUBMITTED', 'TECHNICAL_REVIEW', 'BOARD_REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'INSPECTION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RenovationType" AS ENUM ('KITCHEN', 'BATHROOM', 'FLOORING', 'WALLS', 'ELECTRICAL', 'PLUMBING', 'VENTILATION', 'BALCONY', 'OTHER');

-- CreateEnum
CREATE TYPE "DisturbanceStatus" AS ENUM ('REPORTED', 'ACKNOWLEDGED', 'FIRST_WARNING', 'SECOND_WARNING', 'BOARD_REVIEW', 'RESOLVED', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisturbanceType" AS ENUM ('NOISE', 'SMOKE', 'THREATS', 'PROPERTY_DAMAGE', 'COMMON_AREA_MISUSE', 'PETS', 'WASTE', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('LAUNDRY', 'SAUNA', 'GUEST_APARTMENT', 'PARTY_ROOM', 'GYM', 'OTHER');

-- AlterTable
ALTER TABLE "DamageReport" ADD COLUMN     "actualCost" DOUBLE PRECISION,
ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "estimatedCost" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "SubletApplication" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "status" "SubletStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reason" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "tenantName" TEXT NOT NULL,
    "tenantEmail" TEXT,
    "tenantPhone" TEXT,
    "subletFeeAmount" DOUBLE PRECISION,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "boardNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubletApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenovationApplication" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "status" "RenovationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "type" "RenovationType" NOT NULL,
    "description" TEXT NOT NULL,
    "affectsStructure" BOOLEAN NOT NULL DEFAULT false,
    "affectsPlumbing" BOOLEAN NOT NULL DEFAULT false,
    "affectsElectrical" BOOLEAN NOT NULL DEFAULT false,
    "affectsVentilation" BOOLEAN NOT NULL DEFAULT false,
    "plannedStartDate" TIMESTAMP(3),
    "plannedEndDate" TIMESTAMP(3),
    "estimatedCost" DOUBLE PRECISION,
    "technicalAssessment" TEXT,
    "technicalAssessedBy" TEXT,
    "technicalAssessedAt" TIMESTAMP(3),
    "conditions" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "inspectionDate" TIMESTAMP(3),
    "inspectionResult" TEXT,
    "inspectedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenovationApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisturbanceCase" (
    "id" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "status" "DisturbanceStatus" NOT NULL DEFAULT 'REPORTED',
    "type" "DisturbanceType" NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "targetApartmentId" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "firstWarningAt" TIMESTAMP(3),
    "firstWarningBy" TEXT,
    "secondWarningAt" TIMESTAMP(3),
    "secondWarningBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisturbanceCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookableResource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "maxDurationHours" INTEGER NOT NULL DEFAULT 3,
    "advanceBookingDays" INTEGER NOT NULL DEFAULT 14,
    "rulesText" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookableResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubletApplication_apartmentId_idx" ON "SubletApplication"("apartmentId");

-- CreateIndex
CREATE INDEX "SubletApplication_applicantId_idx" ON "SubletApplication"("applicantId");

-- CreateIndex
CREATE INDEX "SubletApplication_status_idx" ON "SubletApplication"("status");

-- CreateIndex
CREATE INDEX "RenovationApplication_apartmentId_idx" ON "RenovationApplication"("apartmentId");

-- CreateIndex
CREATE INDEX "RenovationApplication_applicantId_idx" ON "RenovationApplication"("applicantId");

-- CreateIndex
CREATE INDEX "RenovationApplication_status_idx" ON "RenovationApplication"("status");

-- CreateIndex
CREATE INDEX "DisturbanceCase_reportedById_idx" ON "DisturbanceCase"("reportedById");

-- CreateIndex
CREATE INDEX "DisturbanceCase_status_idx" ON "DisturbanceCase"("status");

-- CreateIndex
CREATE INDEX "DisturbanceCase_targetApartmentId_idx" ON "DisturbanceCase"("targetApartmentId");

-- CreateIndex
CREATE INDEX "Booking_resourceId_startTime_idx" ON "Booking"("resourceId", "startTime");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- AddForeignKey
ALTER TABLE "SubletApplication" ADD CONSTRAINT "SubletApplication_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubletApplication" ADD CONSTRAINT "SubletApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenovationApplication" ADD CONSTRAINT "RenovationApplication_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenovationApplication" ADD CONSTRAINT "RenovationApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisturbanceCase" ADD CONSTRAINT "DisturbanceCase_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisturbanceCase" ADD CONSTRAINT "DisturbanceCase_targetApartmentId_fkey" FOREIGN KEY ("targetApartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "BookableResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

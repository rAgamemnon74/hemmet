-- CreateEnum
CREATE TYPE "ComponentCondition" AS ENUM ('GOOD', 'FAIR', 'POOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ComponentCategory" AS ENUM ('ROOF', 'FACADE', 'WINDOWS', 'PLUMBING', 'ELECTRICAL', 'VENTILATION', 'ELEVATOR', 'BALCONY', 'FOUNDATION', 'DRAINAGE', 'HEATING', 'COMMON_AREAS', 'PARKING', 'OUTDOOR', 'OTHER');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('OVK', 'ELEVATOR', 'FIRE_SAFETY', 'ENERGY', 'RADON', 'PLAYGROUND', 'CISTERN', 'COMPONENT', 'OTHER');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('APPROVED', 'APPROVED_WITH_REMARKS', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "BuildingComponent" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "category" "ComponentCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "installYear" INTEGER,
    "expectedLifespan" INTEGER,
    "condition" "ComponentCondition" NOT NULL DEFAULT 'GOOD',
    "lastInspectedAt" TIMESTAMP(3),
    "nextActionYear" INTEGER,
    "estimatedCost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "componentId" TEXT,
    "type" "InspectionType" NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "result" "InspectionResult" NOT NULL DEFAULT 'PENDING',
    "inspector" TEXT,
    "certificateUrl" TEXT,
    "nextDueAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgNumber" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "category" TEXT NOT NULL,
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "contractUrl" TEXT,
    "pubAgreement" BOOLEAN NOT NULL DEFAULT false,
    "pubAgreementDate" TIMESTAMP(3),
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuildingComponent_buildingId_idx" ON "BuildingComponent"("buildingId");

-- CreateIndex
CREATE INDEX "BuildingComponent_category_idx" ON "BuildingComponent"("category");

-- CreateIndex
CREATE INDEX "Inspection_buildingId_idx" ON "Inspection"("buildingId");

-- CreateIndex
CREATE INDEX "Inspection_type_idx" ON "Inspection"("type");

-- CreateIndex
CREATE INDEX "Inspection_nextDueAt_idx" ON "Inspection"("nextDueAt");

-- CreateIndex
CREATE INDEX "Contractor_category_idx" ON "Contractor"("category");

-- CreateIndex
CREATE INDEX "Contractor_active_idx" ON "Contractor"("active");

-- AddForeignKey
ALTER TABLE "BuildingComponent" ADD CONSTRAINT "BuildingComponent_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "BuildingComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

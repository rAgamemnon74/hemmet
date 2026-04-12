-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnnualReportStatus" ADD VALUE 'FINAL_UPLOADED';
ALTER TYPE "AnnualReportStatus" ADD VALUE 'SIGNED';

-- AlterTable
ALTER TABLE "AnnualReport" ADD COLUMN     "allSigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "finalPdfName" TEXT,
ADD COLUMN     "finalPdfUrl" TEXT,
ADD COLUMN     "finalUploadedAt" TIMESTAMP(3),
ADD COLUMN     "finalUploadedBy" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3),
ADD COLUMN     "signedBy" TEXT[];

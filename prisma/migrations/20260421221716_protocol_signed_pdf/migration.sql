-- AlterTable
ALTER TABLE "Protocol" ADD COLUMN     "signedPdfDocumentId" TEXT,
ADD COLUMN     "signedPdfUploadedAt" TIMESTAMP(3),
ADD COLUMN     "signedPdfUploadedById" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "exitDocumentId" TEXT,
ADD COLUMN     "exitReason" TEXT,
ADD COLUMN     "exitedAt" TIMESTAMP(3);

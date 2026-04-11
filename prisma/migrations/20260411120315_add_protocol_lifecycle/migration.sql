-- CreateEnum
CREATE TYPE "ProtocolStatus" AS ENUM ('DRAFT', 'FINALIZED', 'SIGNED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Protocol" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "finalizedAt" TIMESTAMP(3),
ADD COLUMN     "finalizedBy" TEXT,
ADD COLUMN     "status" "ProtocolStatus" NOT NULL DEFAULT 'DRAFT';

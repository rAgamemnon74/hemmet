-- AlterEnum
ALTER TYPE "AgendaItemType" ADD VALUE 'NEXT_MEETING';

-- AlterTable
ALTER TABLE "AgendaItem" ADD COLUMN     "proposedDate" TIMESTAMP(3);

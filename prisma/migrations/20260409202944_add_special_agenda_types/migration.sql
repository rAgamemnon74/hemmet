-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AgendaItemType" ADD VALUE 'OPENING';
ALTER TYPE "AgendaItemType" ADD VALUE 'ELECT_CHAIR';
ALTER TYPE "AgendaItemType" ADD VALUE 'ELECT_SECRETARY';
ALTER TYPE "AgendaItemType" ADD VALUE 'ELECT_ADJUSTERS';

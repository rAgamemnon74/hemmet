-- CreateEnum
CREATE TYPE "AgendaItemType" AS ENUM ('MOTIONS', 'BOARD_MATTERS');

-- AlterTable
ALTER TABLE "AgendaItem" ADD COLUMN     "specialType" "AgendaItemType";

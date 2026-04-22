-- AlterTable
ALTER TABLE "Motion" ADD COLUMN     "boardRespondedAt" TIMESTAMP(3),
ADD COLUMN     "boardResponseMeetingId" TEXT;

-- CreateIndex
CREATE INDEX "Motion_boardResponseMeetingId_idx" ON "Motion"("boardResponseMeetingId");

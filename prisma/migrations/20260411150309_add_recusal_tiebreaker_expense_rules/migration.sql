-- AlterTable
ALTER TABLE "BrfRules" ADD COLUMN     "expenseApprovalMaxAmount" DOUBLE PRECISION,
ADD COLUMN     "expenseSelfApprovalBlocked" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Decision" ADD COLUMN     "participantIds" TEXT[],
ADD COLUMN     "tiebrokenByChairperson" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DecisionRecusal" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionRecusal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DecisionRecusal_decisionId_idx" ON "DecisionRecusal"("decisionId");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionRecusal_decisionId_userId_key" ON "DecisionRecusal"("decisionId", "userId");

-- AddForeignKey
ALTER TABLE "DecisionRecusal" ADD CONSTRAINT "DecisionRecusal_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "description" TEXT,
ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedBy" TEXT,
ADD COLUMN     "storedName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "visibleToAll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visibleToMembers" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

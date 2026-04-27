-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "engineState" JSONB,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "bookingIntent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "budget" TEXT,
ADD COLUMN     "freeformNotes" TEXT,
ADD COLUMN     "lastQualifiedAt" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "preferredContactMethod" TEXT,
ADD COLUMN     "qualificationConfidence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "qualificationData" JSONB,
ADD COLUMN     "serviceInterest" TEXT,
ADD COLUMN     "urgency" TEXT;

-- AlterTable
ALTER TABLE "QualificationPlaybook" ADD COLUMN     "config" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "QualificationPlaybook_organizationId_isActive_idx" ON "QualificationPlaybook"("organizationId", "isActive");

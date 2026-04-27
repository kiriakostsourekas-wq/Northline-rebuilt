-- CreateEnum
CREATE TYPE "AiResponderState" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "HandoffEventType" AS ENUM ('REQUESTED', 'ACCEPTED', 'ASSIGNED', 'NOTE_ADDED', 'RESOLVED', 'CANCELLED', 'AI_PAUSED', 'AI_RESUMED');

-- AlterTable
ALTER TABLE "Conversation"
ADD COLUMN "aiResponderState" "AiResponderState" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "aiPausedAt" TIMESTAMP(3),
ADD COLUMN "aiResumedAt" TIMESTAMP(3),
ADD COLUMN "aiPauseReason" TEXT;

-- CreateTable
CREATE TABLE "HandoffEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "leadId" TEXT,
    "handoffId" TEXT,
    "actorUserId" TEXT,
    "eventType" "HandoffEventType" NOT NULL,
    "reason" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandoffEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_organizationId_aiResponderState_idx" ON "Conversation"("organizationId", "aiResponderState");

-- CreateIndex
CREATE INDEX "HandoffEvent_organizationId_createdAt_idx" ON "HandoffEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "HandoffEvent_conversationId_createdAt_idx" ON "HandoffEvent"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "HandoffEvent_handoffId_createdAt_idx" ON "HandoffEvent"("handoffId", "createdAt");

-- CreateIndex
CREATE INDEX "HandoffEvent_actorUserId_createdAt_idx" ON "HandoffEvent"("actorUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "HandoffEvent" ADD CONSTRAINT "HandoffEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoffEvent" ADD CONSTRAINT "HandoffEvent_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoffEvent" ADD CONSTRAINT "HandoffEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoffEvent" ADD CONSTRAINT "HandoffEvent_handoffId_fkey" FOREIGN KEY ("handoffId") REFERENCES "Handoff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoffEvent" ADD CONSTRAINT "HandoffEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

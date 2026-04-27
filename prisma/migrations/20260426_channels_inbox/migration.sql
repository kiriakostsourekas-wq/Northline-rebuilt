-- CreateEnum
CREATE TYPE "ChannelEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "OutboundDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'RETRYING', 'FAILED', 'SKIPPED');

-- AlterEnum
ALTER TYPE "ChannelType" ADD VALUE 'TELEGRAM';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "assignedUserId" TEXT,
ADD COLUMN     "handoffRequestedAt" TIMESTAMP(3),
ADD COLUMN     "lastInboundAt" TIMESTAMP(3),
ADD COLUMN     "lastMessagePreview" TEXT,
ADD COLUMN     "lastOutboundAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "externalMessageId" TEXT,
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ContactIdentity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "channelId" TEXT,
    "channelType" "ChannelType" NOT NULL,
    "externalContactId" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "handle" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 80,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "ContactIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channelId" TEXT,
    "provider" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "ChannelEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundMessageAttempt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channelId" TEXT,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT,
    "provider" TEXT NOT NULL,
    "status" "OutboundDeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "idempotencyKey" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundMessageAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactIdentity_organizationId_email_idx" ON "ContactIdentity"("organizationId", "email");

-- CreateIndex
CREATE INDEX "ContactIdentity_organizationId_phone_idx" ON "ContactIdentity"("organizationId", "phone");

-- CreateIndex
CREATE INDEX "ContactIdentity_leadId_idx" ON "ContactIdentity"("leadId");

-- CreateIndex
CREATE INDEX "ContactIdentity_channelId_idx" ON "ContactIdentity"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactIdentity_organizationId_channelType_externalContactI_key" ON "ContactIdentity"("organizationId", "channelType", "externalContactId");

-- CreateIndex
CREATE INDEX "ChannelEvent_organizationId_status_idx" ON "ChannelEvent"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ChannelEvent_channelId_receivedAt_idx" ON "ChannelEvent"("channelId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelEvent_organizationId_provider_externalEventId_key" ON "ChannelEvent"("organizationId", "provider", "externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "OutboundMessageAttempt_idempotencyKey_key" ON "OutboundMessageAttempt"("idempotencyKey");

-- CreateIndex
CREATE INDEX "OutboundMessageAttempt_organizationId_status_idx" ON "OutboundMessageAttempt"("organizationId", "status");

-- CreateIndex
CREATE INDEX "OutboundMessageAttempt_conversationId_createdAt_idx" ON "OutboundMessageAttempt"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "OutboundMessageAttempt_channelId_status_idx" ON "OutboundMessageAttempt"("channelId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_organizationId_type_externalAccountId_key" ON "Channel"("organizationId", "type", "externalAccountId");

-- CreateIndex
CREATE INDEX "Conversation_organizationId_assignedUserId_idx" ON "Conversation"("organizationId", "assignedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_organizationId_channelId_externalThreadId_key" ON "Conversation"("organizationId", "channelId", "externalThreadId");

-- CreateIndex
CREATE INDEX "Lead_organizationId_email_idx" ON "Lead"("organizationId", "email");

-- CreateIndex
CREATE INDEX "Lead_organizationId_phone_idx" ON "Lead"("organizationId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_externalMessageId_key" ON "Message"("conversationId", "externalMessageId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactIdentity" ADD CONSTRAINT "ContactIdentity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactIdentity" ADD CONSTRAINT "ContactIdentity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactIdentity" ADD CONSTRAINT "ContactIdentity_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelEvent" ADD CONSTRAINT "ChannelEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelEvent" ADD CONSTRAINT "ChannelEvent_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMessageAttempt" ADD CONSTRAINT "OutboundMessageAttempt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMessageAttempt" ADD CONSTRAINT "OutboundMessageAttempt_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMessageAttempt" ADD CONSTRAINT "OutboundMessageAttempt_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMessageAttempt" ADD CONSTRAINT "OutboundMessageAttempt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

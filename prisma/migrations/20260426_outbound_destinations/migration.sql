-- CreateEnum
CREATE TYPE "DestinationType" AS ENUM ('WEBHOOK', 'CRM');

-- CreateEnum
CREATE TYPE "DestinationProvider" AS ENUM ('WEBHOOK', 'HUBSPOT', 'SALESFORCE', 'PIPEDRIVE', 'CUSTOM_CRM');

-- CreateEnum
CREATE TYPE "DestinationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ExportEventType" AS ENUM ('LEAD_QUALIFIED', 'LEAD_BOOKED', 'BOOKING_CONFIRMED', 'MANUAL_REPLAY');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'PARTIAL', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ExportDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING', 'SKIPPED');

-- CreateTable
CREATE TABLE "OutboundDestination" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DestinationType" NOT NULL,
    "provider" "DestinationProvider" NOT NULL DEFAULT 'WEBHOOK',
    "status" "DestinationStatus" NOT NULL DEFAULT 'ACTIVE',
    "endpointUrl" TEXT,
    "secretEncrypted" TEXT,
    "secretLast4" TEXT,
    "headers" JSONB,
    "eventTypes" "ExportEventType"[] DEFAULT ARRAY['LEAD_QUALIFIED', 'BOOKING_CONFIRMED']::"ExportEventType"[],
    "includeRawConversation" BOOLEAN NOT NULL DEFAULT false,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadExport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "conversationId" TEXT,
    "bookingRequestId" TEXT,
    "eventType" "ExportEventType" NOT NULL,
    "payloadVersion" TEXT NOT NULL DEFAULT 'northline.lead_export.v1',
    "payload" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "exportId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "status" "ExportDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT NOT NULL,
    "requestPayloadHash" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboundDestination_organizationId_status_idx" ON "OutboundDestination"("organizationId", "status");

-- CreateIndex
CREATE INDEX "OutboundDestination_organizationId_provider_idx" ON "OutboundDestination"("organizationId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "LeadExport_idempotencyKey_key" ON "LeadExport"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LeadExport_organizationId_status_idx" ON "LeadExport"("organizationId", "status");

-- CreateIndex
CREATE INDEX "LeadExport_organizationId_eventType_createdAt_idx" ON "LeadExport"("organizationId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "LeadExport_leadId_createdAt_idx" ON "LeadExport"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadExport_conversationId_idx" ON "LeadExport"("conversationId");

-- CreateIndex
CREATE INDEX "LeadExport_bookingRequestId_idx" ON "LeadExport"("bookingRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ExportDeliveryAttempt_idempotencyKey_key" ON "ExportDeliveryAttempt"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ExportDeliveryAttempt_organizationId_status_nextAttemptAt_idx" ON "ExportDeliveryAttempt"("organizationId", "status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "ExportDeliveryAttempt_destinationId_status_idx" ON "ExportDeliveryAttempt"("destinationId", "status");

-- CreateIndex
CREATE INDEX "ExportDeliveryAttempt_exportId_createdAt_idx" ON "ExportDeliveryAttempt"("exportId", "createdAt");

-- AddForeignKey
ALTER TABLE "OutboundDestination" ADD CONSTRAINT "OutboundDestination_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadExport" ADD CONSTRAINT "LeadExport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadExport" ADD CONSTRAINT "LeadExport_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadExport" ADD CONSTRAINT "LeadExport_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadExport" ADD CONSTRAINT "LeadExport_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportDeliveryAttempt" ADD CONSTRAINT "ExportDeliveryAttempt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportDeliveryAttempt" ADD CONSTRAINT "ExportDeliveryAttempt_exportId_fkey" FOREIGN KEY ("exportId") REFERENCES "LeadExport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportDeliveryAttempt" ADD CONSTRAINT "ExportDeliveryAttempt_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "OutboundDestination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

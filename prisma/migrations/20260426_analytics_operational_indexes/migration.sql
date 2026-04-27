-- CreateIndex
CREATE INDEX "Conversation_organizationId_createdAt_idx" ON "Conversation"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_organizationId_lastInboundAt_idx" ON "Conversation"("organizationId", "lastInboundAt");

-- CreateIndex
CREATE INDEX "BookingRequest_organizationId_createdAt_idx" ON "BookingRequest"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadExport_organizationId_createdAt_idx" ON "LeadExport"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ExportDeliveryAttempt_organizationId_createdAt_idx" ON "ExportDeliveryAttempt"("organizationId", "createdAt");

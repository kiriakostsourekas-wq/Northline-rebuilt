-- CreateEnum
CREATE TYPE "BookingProvider" AS ENUM ('LOCAL_MOCK', 'GOOGLE_CALENDAR');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'SLOT_SUGGESTED', 'PENDING_CONFIRMATION', 'CONFIRMED', 'RESCHEDULE_REQUESTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- AlterTable
ALTER TABLE "BookingRequest" RENAME COLUMN "status" TO "statusText";

ALTER TABLE "BookingRequest" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerLocale" "Locale",
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "meetingTypeId" TEXT,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "provider" "BookingProvider" NOT NULL DEFAULT 'LOCAL_MOCK',
ADD COLUMN     "rescheduledFromId" TEXT,
ADD COLUMN     "startsAt" TIMESTAMP(3),
ADD COLUMN     "structuredData" JSONB,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED';

UPDATE "BookingRequest"
SET
  "organizationId" = "Lead"."organizationId",
  "customerName" = COALESCE("BookingRequest"."customerName", "Lead"."fullName"),
  "customerEmail" = COALESCE("BookingRequest"."customerEmail", "Lead"."email"),
  "customerPhone" = COALESCE("BookingRequest"."customerPhone", "Lead"."phone"),
  "customerLocale" = COALESCE("BookingRequest"."customerLocale", "Lead"."preferredLocale"),
  "startsAt" = COALESCE("BookingRequest"."startsAt", "BookingRequest"."requestedTime"),
  "summary" = COALESCE("BookingRequest"."summary", "Lead"."summary")
FROM "Lead"
WHERE "BookingRequest"."leadId" = "Lead"."id";

UPDATE "BookingRequest"
SET "status" = CASE
  WHEN "statusText" = 'SLOT_SUGGESTED' THEN 'SLOT_SUGGESTED'::"BookingStatus"
  WHEN "statusText" = 'PENDING_CONFIRMATION' THEN 'PENDING_CONFIRMATION'::"BookingStatus"
  WHEN "statusText" = 'CONFIRMED' THEN 'CONFIRMED'::"BookingStatus"
  WHEN "statusText" = 'RESCHEDULE_REQUESTED' THEN 'RESCHEDULE_REQUESTED'::"BookingStatus"
  WHEN "statusText" = 'CANCELLED' THEN 'CANCELLED'::"BookingStatus"
  WHEN "statusText" = 'COMPLETED' THEN 'COMPLETED'::"BookingStatus"
  WHEN "statusText" = 'NO_SHOW' THEN 'NO_SHOW'::"BookingStatus"
  ELSE 'REQUESTED'::"BookingStatus"
END;

ALTER TABLE "BookingRequest" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "BookingRequest" DROP COLUMN "statusText";

-- CreateTable
CREATE TABLE "BookingSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "BookingProvider" NOT NULL DEFAULT 'LOCAL_MOCK',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Athens',
    "calendarId" TEXT,
    "slotIncrementMinutes" INTEGER NOT NULL DEFAULT 30,
    "minNoticeMinutes" INTEGER NOT NULL DEFAULT 120,
    "maxAdvanceDays" INTEGER NOT NULL DEFAULT 30,
    "autoConfirm" BOOLEAN NOT NULL DEFAULT false,
    "confirmationMode" TEXT NOT NULL DEFAULT 'CONFIRM_CONTACT_AND_SLOT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingType" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityWindow" (
    "id" TEXT NOT NULL,
    "bookingSettingsId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingBlackout" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingBlackout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bookingRequestId" TEXT,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingSettings_organizationId_key" ON "BookingSettings"("organizationId");

-- CreateIndex
CREATE INDEX "BookingSettings_organizationId_provider_idx" ON "BookingSettings"("organizationId", "provider");

-- CreateIndex
CREATE INDEX "MeetingType_organizationId_isActive_idx" ON "MeetingType"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "MeetingType_organizationId_sortOrder_idx" ON "MeetingType"("organizationId", "sortOrder");

-- CreateIndex
CREATE INDEX "AvailabilityWindow_bookingSettingsId_dayOfWeek_idx" ON "AvailabilityWindow"("bookingSettingsId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "BookingBlackout_organizationId_startsAt_endsAt_idx" ON "BookingBlackout"("organizationId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "BookingEvent_organizationId_createdAt_idx" ON "BookingEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingEvent_bookingRequestId_createdAt_idx" ON "BookingEvent"("bookingRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingRequest_organizationId_status_idx" ON "BookingRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "BookingRequest_organizationId_startsAt_idx" ON "BookingRequest"("organizationId", "startsAt");

-- CreateIndex
CREATE INDEX "BookingRequest_leadId_status_idx" ON "BookingRequest"("leadId", "status");

-- CreateIndex
CREATE INDEX "BookingRequest_conversationId_idx" ON "BookingRequest"("conversationId");

-- CreateIndex
CREATE INDEX "BookingRequest_meetingTypeId_idx" ON "BookingRequest"("meetingTypeId");

-- AddForeignKey
ALTER TABLE "BookingSettings" ADD CONSTRAINT "BookingSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingType" ADD CONSTRAINT "MeetingType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityWindow" ADD CONSTRAINT "AvailabilityWindow_bookingSettingsId_fkey" FOREIGN KEY ("bookingSettingsId") REFERENCES "BookingSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingBlackout" ADD CONSTRAINT "BookingBlackout_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_meetingTypeId_fkey" FOREIGN KEY ("meetingTypeId") REFERENCES "MeetingType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_rescheduledFromId_fkey" FOREIGN KEY ("rescheduledFromId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingEvent" ADD CONSTRAINT "BookingEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingEvent" ADD CONSTRAINT "BookingEvent_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

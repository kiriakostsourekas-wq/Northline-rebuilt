-- CreateEnum
CREATE TYPE "BusinessContextSection" AS ENUM ('BUSINESS_PROFILE', 'SERVICES', 'PRICING', 'FAQ', 'LOCATIONS', 'OPENING_HOURS', 'QUALIFICATION_RULES', 'BOOKING_RULES', 'ESCALATION_RULES', 'CUSTOM_NOTES');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "BusinessContextItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "section" "BusinessContextSection" NOT NULL,
    "locale" "Locale",
    "title" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "structuredData" JSONB NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessContextItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessContextRevision" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessContextRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessContextItem_organizationId_section_status_idx" ON "BusinessContextItem"("organizationId", "section", "status");

-- CreateIndex
CREATE INDEX "BusinessContextItem_organizationId_locale_idx" ON "BusinessContextItem"("organizationId", "locale");

-- CreateIndex
CREATE INDEX "BusinessContextItem_organizationId_updatedAt_idx" ON "BusinessContextItem"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "BusinessContextRevision_organizationId_createdAt_idx" ON "BusinessContextRevision"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "BusinessContextRevision_changedByUserId_idx" ON "BusinessContextRevision"("changedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessContextRevision_itemId_version_key" ON "BusinessContextRevision"("itemId", "version");

-- AddForeignKey
ALTER TABLE "BusinessContextItem" ADD CONSTRAINT "BusinessContextItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessContextItem" ADD CONSTRAINT "BusinessContextItem_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessContextItem" ADD CONSTRAINT "BusinessContextItem_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessContextRevision" ADD CONSTRAINT "BusinessContextRevision_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BusinessContextItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessContextRevision" ADD CONSTRAINT "BusinessContextRevision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessContextRevision" ADD CONSTRAINT "BusinessContextRevision_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

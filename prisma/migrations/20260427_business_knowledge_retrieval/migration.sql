-- CreateEnum
CREATE TYPE "KnowledgeChunkStatus" AS ENUM ('ACTIVE', 'STALE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "KnowledgeIndexJobType" AS ENUM ('UPSERT_ITEM', 'DELETE_ITEM', 'REINDEX_WORKSPACE');

-- CreateEnum
CREATE TYPE "KnowledgeIndexJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "BusinessKnowledgeChunk" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "section" "BusinessContextSection" NOT NULL,
    "locale" "Locale",
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'PUBLISHED',
    "chunkStatus" "KnowledgeChunkStatus" NOT NULL DEFAULT 'ACTIVE',
    "chunkIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "searchText" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "contentHash" TEXT NOT NULL,
    "tokensEstimate" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL,
    "embedding" DOUBLE PRECISION[] NOT NULL DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "embeddingProvider" TEXT,
    "embeddingModel" TEXT,
    "embeddingDimensions" INTEGER,
    "embeddingHash" TEXT,
    "indexedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessKnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeIndexJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemId" TEXT,
    "jobType" "KnowledgeIndexJobType" NOT NULL,
    "status" "KnowledgeIndexJobStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "errorMessage" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeIndexJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessKnowledgeChunk_itemId_chunkIndex_key" ON "BusinessKnowledgeChunk"("itemId", "chunkIndex");

-- CreateIndex
CREATE INDEX "BusinessKnowledgeChunk_organizationId_section_locale_idx" ON "BusinessKnowledgeChunk"("organizationId", "section", "locale");

-- CreateIndex
CREATE INDEX "BusinessKnowledgeChunk_organizationId_chunkStatus_idx" ON "BusinessKnowledgeChunk"("organizationId", "chunkStatus");

-- CreateIndex
CREATE INDEX "BusinessKnowledgeChunk_retrieval_scan_idx" ON "BusinessKnowledgeChunk"("organizationId", "chunkStatus", "publicationStatus", "indexedAt");

-- CreateIndex
CREATE INDEX "BusinessKnowledgeChunk_organizationId_contentHash_idx" ON "BusinessKnowledgeChunk"("organizationId", "contentHash");

-- CreateIndex
CREATE INDEX "BusinessKnowledgeChunk_itemId_chunkStatus_idx" ON "BusinessKnowledgeChunk"("itemId", "chunkStatus");

-- CreateIndex
CREATE INDEX "KnowledgeIndexJob_organizationId_status_createdAt_idx" ON "KnowledgeIndexJob"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeIndexJob_organizationId_itemId_idx" ON "KnowledgeIndexJob"("organizationId", "itemId");

-- CreateIndex
CREATE INDEX "KnowledgeIndexJob_itemId_status_idx" ON "KnowledgeIndexJob"("itemId", "status");

-- CreateIndex
CREATE INDEX "KnowledgeIndexJob_pending_queue_idx" ON "KnowledgeIndexJob"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "BusinessKnowledgeChunk" ADD CONSTRAINT "BusinessKnowledgeChunk_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessKnowledgeChunk" ADD CONSTRAINT "BusinessKnowledgeChunk_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BusinessContextItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeIndexJob" ADD CONSTRAINT "KnowledgeIndexJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeIndexJob" ADD CONSTRAINT "KnowledgeIndexJob_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BusinessContextItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

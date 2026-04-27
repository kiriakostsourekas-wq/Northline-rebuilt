-- CreateEnum
CREATE TYPE "MessageLanguage" AS ENUM ('GREEK', 'ENGLISH', 'MIXED', 'GREEKLISH', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "detectedLanguage" "MessageLanguage" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "displayBody" TEXT,
ADD COLUMN     "languageConfidence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "languageMetadata" JSONB,
ADD COLUMN     "normalizedBody" TEXT,
ADD COLUMN     "rawBody" TEXT,
ADD COLUMN     "searchBody" TEXT;

-- CreateIndex
CREATE INDEX "Message_conversationId_detectedLanguage_idx" ON "Message"("conversationId", "detectedLanguage");

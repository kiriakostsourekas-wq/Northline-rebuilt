import { createHash } from "node:crypto";
import { analyzeText } from "@/lib/language/normalization";
import { normalizeForContext } from "@/lib/knowledge/normalization";
import {
  getKnowledgeSectionIndexPolicy,
  renderIndexableBusinessText,
} from "@/lib/knowledge/retrieval-policy";
import type { BusinessContextRecord } from "@/lib/knowledge/types";
import type { KnowledgeChunk, RetrievalLanguage } from "@/lib/knowledge/retrieval-types";

const defaultMaxChunkChars = 900;
const chunkOverlapChars = 120;

export function buildKnowledgeChunks(
  item: BusinessContextRecord,
  options: { maxChunkChars?: number } = {},
): KnowledgeChunk[] {
  if (item.status !== "PUBLISHED") return [];

  const policy = getKnowledgeSectionIndexPolicy(item.section);
  if (policy.mode === "structured_only") return [];

  const indexableText = normalizeForContext(
    renderIndexableBusinessText({
      section: item.section,
      title: item.title,
      structuredData: item.structuredData,
    }),
  );
  if (!indexableText) return [];

  const maxChunkChars = options.maxChunkChars ?? defaultMaxChunkChars;
  return splitText(indexableText, maxChunkChars).map((text, chunkIndex) => {
    const analysis = analyzeText(text);
    return {
      itemId: item.id,
      section: item.section,
      locale: item.locale,
      chunkIndex,
      title: item.title,
      text,
      normalizedText: analysis.normalizedText,
      searchText: analysis.searchText,
      language: mapLanguage(analysis.detection.language),
      contentHash: hashContent([
        item.id,
        item.section,
        item.locale ?? "MIXED",
        String(chunkIndex),
        text,
      ]),
      tokensEstimate: estimateTokens(text),
      metadata: {
        source: "business_context_item",
        sourceItemId: item.id,
        section: item.section,
        locale: item.locale,
        policyMode: policy.mode,
        indexedFields: policy.indexedFields,
        structuredPrimary: true,
        sourceUpdatedAt: item.updatedAt?.toISOString(),
      },
    };
  });
}

export function hashContent(parts: string[]) {
  return createHash("sha256").update(parts.join("\n")).digest("hex");
}

export function estimateTokens(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

function splitText(value: string, maxChunkChars: number) {
  if (value.length <= maxChunkChars) return [value];

  const paragraphs = value.split(/\n{2,}|\n(?=[A-ZΑ-Ω][^:\n]{0,80}:)/u);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const normalized = paragraph.trim();
    if (!normalized) continue;

    if (!current) {
      current = normalized;
      continue;
    }

    const candidate = `${current}\n${normalized}`;
    if (candidate.length <= maxChunkChars) {
      current = candidate;
      continue;
    }

    chunks.push(current);
    current = withOverlap(current, normalized, maxChunkChars);
  }

  if (current) chunks.push(current);
  return chunks.flatMap((chunk) => hardSplit(chunk, maxChunkChars));
}

function withOverlap(previous: string, next: string, maxChunkChars: number) {
  const overlap = previous.slice(-chunkOverlapChars).trim();
  const candidate = overlap ? `${overlap}\n${next}` : next;
  return candidate.length <= maxChunkChars ? candidate : next;
}

function hardSplit(value: string, maxChunkChars: number) {
  if (value.length <= maxChunkChars) return [value];

  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < value.length) {
    const end = Math.min(cursor + maxChunkChars, value.length);
    chunks.push(value.slice(cursor, end).trim());
    cursor =
      end >= value.length
        ? end
        : Math.max(end - chunkOverlapChars, cursor + 1);
  }
  return chunks.filter(Boolean);
}

function mapLanguage(language: string): RetrievalLanguage {
  if (language === "ENGLISH") return "ENGLISH";
  if (language === "GREEK") return "GREEK";
  if (language === "GREEKLISH") return "GREEKLISH";
  if (language === "MIXED") return "MIXED";
  return "UNKNOWN";
}

import { Prisma } from "@/generated/prisma/client";
import { analyzeText } from "@/lib/language/normalization";
import {
  createEmbeddingProviderFromEnv,
  type EmbeddingProvider,
} from "@/lib/knowledge/embedding-provider";
import { buildKnowledgeChunks } from "@/lib/knowledge/chunking";
import { assembleBusinessContextBundle } from "@/lib/knowledge/context";
import { mergeCurrentRetrievalChunks } from "@/lib/knowledge/retrieval-fallback";
import { rankKnowledgeChunks } from "@/lib/knowledge/retrieval-ranking";
import type {
  BusinessContextRecord,
  BusinessContextRetrievalPacket,
  BusinessContextSectionValue,
} from "@/lib/knowledge/types";
import type {
  KnowledgeContextAssemblyInput,
  KnowledgeQuery,
  KnowledgeRetrievalResult,
  StoredKnowledgeChunk,
} from "@/lib/knowledge/retrieval-types";
import { safeErrorMessage } from "@/lib/security/logging";
import { getPrismaClient } from "@/server/db";

export async function retrieveBusinessKnowledge(
  input: KnowledgeQuery & {
    structuredItems?: BusinessContextRecord[];
    provider?: EmbeddingProvider;
  },
): Promise<KnowledgeRetrievalResult> {
  const provider = input.provider ?? createEmbeddingProviderFromEnv();
  const queryAnalysis = analyzeText(input.query);
  const chunks = await loadRetrievalChunks({
    organizationId: input.organizationId,
    sections: input.sections,
    structuredItems: input.structuredItems,
  });
  const embeddedQuery = await embedQuery({
    provider,
    query: queryAnalysis.searchText || input.query,
  });

  const result = rankKnowledgeChunks({
    query: input,
    chunks,
    queryEmbedding: embeddedQuery.embedding,
    provider: {
      name: provider.name,
      model: provider.model,
      enabled: provider.isEnabled,
      used: embeddedQuery.used,
      fallbackReason: embeddedQuery.fallbackReason,
    },
  });

  console.info("northline.knowledge.retrieval.completed", {
    organizationId: input.organizationId,
    topK: input.topK,
    returned: result.hits.length,
    candidates: result.debug.candidateCount,
    provider: result.debug.provider.name,
    providerUsed: result.debug.provider.used,
    fallbackReason: result.debug.provider.fallbackReason,
  });

  return result;
}

export async function assembleBusinessContextForConversation(
  input: KnowledgeContextAssemblyInput & {
    provider?: EmbeddingProvider;
  },
) {
  const retrieval = await retrieveBusinessKnowledge({
    organizationId: input.organizationId,
    query: input.query,
    preferredLocale: input.preferredLocale,
    topK: input.topK,
    structuredItems: input.items,
    provider: input.provider,
  });
  const retrievalPacket = toBusinessContextRetrievalPacket(retrieval);

  return {
    bundle: assembleBusinessContextBundle({
      workspace: input.workspace,
      items: input.items,
      retrieval: retrievalPacket,
    }),
    retrieval,
  };
}

function toBusinessContextRetrievalPacket(
  retrieval: KnowledgeRetrievalResult,
): BusinessContextRetrievalPacket {
  return {
    query: retrieval.query.query,
    generatedAt: new Date().toISOString(),
    provider: retrieval.debug.provider,
    hits: retrieval.hits.map((hit) => ({
      chunkId: hit.chunk.id,
      itemId: hit.chunk.itemId,
      section: hit.chunk.section,
      title: hit.chunk.title,
      locale: hit.chunk.locale,
      text: hit.chunk.text,
      score: hit.score,
      rank: hit.rank,
      reasons: hit.reasons,
    })),
  };
}

async function loadRetrievalChunks(input: {
  organizationId: string;
  sections?: BusinessContextSectionValue[];
  structuredItems?: BusinessContextRecord[];
}) {
  const prisma = getPrismaClient();
  const rows = await prisma.businessKnowledgeChunk.findMany({
    where: {
      organizationId: input.organizationId,
      chunkStatus: "ACTIVE",
      publicationStatus: "PUBLISHED",
      section: input.sections ? { in: input.sections } : undefined,
    },
    orderBy: [{ indexedAt: "desc" }, { updatedAt: "desc" }],
    take: 240,
  });

  const persistedChunks = rows.map(mapStoredChunk);
  const transientChunks = transientChunksFromStructuredItems(input);

  return mergeCurrentRetrievalChunks({
    persistedChunks,
    transientChunks,
    currentItemIds: input.structuredItems?.map((item) => item.id),
  });
}

function transientChunksFromStructuredItems(input: {
  organizationId: string;
  sections?: BusinessContextSectionValue[];
  structuredItems?: BusinessContextRecord[];
}) {
  return (input.structuredItems ?? [])
    .flatMap((item) => buildKnowledgeChunks(item))
    .filter((chunk) => !input.sections || input.sections.includes(chunk.section))
    .map((chunk): StoredKnowledgeChunk => ({
      ...chunk,
      id: `transient_${chunk.itemId}_${chunk.chunkIndex}`,
      organizationId: input.organizationId,
      embedding: [],
      embeddingProvider: null,
      embeddingModel: null,
      embeddingDimensions: null,
      embeddingHash: null,
      indexedAt: null,
    }));
}

async function embedQuery(input: {
  provider: EmbeddingProvider;
  query: string;
}) {
  if (!input.query.trim()) {
    return {
      embedding: null,
      used: false,
      fallbackReason: "Empty retrieval query.",
    };
  }
  if (!input.provider.isEnabled) {
    return {
      embedding: null,
      used: false,
      fallbackReason:
        "Embedding provider disabled; retrieval used lexical ranking only.",
    };
  }

  try {
    const response = await input.provider.embed({ texts: [input.query] });
    return {
      embedding: response.embeddings[0],
      used: true,
      fallbackReason: undefined,
    };
  } catch (error) {
    return {
      embedding: null,
      used: false,
      fallbackReason: `Embedding query failed; retrieval used lexical ranking only: ${safeErrorMessage(error)}`,
    };
  }
}

function mapStoredChunk(row: {
  id: string;
  organizationId: string;
  itemId: string;
  section: string;
  locale: "EN" | "EL" | null;
  chunkIndex: number;
  title: string;
  text: string;
  normalizedText: string;
  searchText: string;
  language: string;
  contentHash: string;
  tokensEstimate: number;
  metadata: Prisma.JsonValue;
  embedding: number[];
  embeddingProvider: string | null;
  embeddingModel: string | null;
  embeddingDimensions: number | null;
  embeddingHash: string | null;
  indexedAt: Date | null;
}): StoredKnowledgeChunk {
  return {
    id: row.id,
    organizationId: row.organizationId,
    itemId: row.itemId,
    section: row.section as BusinessContextSectionValue,
    locale: row.locale,
    chunkIndex: row.chunkIndex,
    title: row.title,
    text: row.text,
    normalizedText: row.normalizedText,
    searchText: row.searchText,
    language: mapLanguage(row.language),
    contentHash: row.contentHash,
    tokensEstimate: row.tokensEstimate,
    metadata: toMetadata(row.metadata),
    embedding: row.embedding,
    embeddingProvider: row.embeddingProvider,
    embeddingModel: row.embeddingModel,
    embeddingDimensions: row.embeddingDimensions,
    embeddingHash: row.embeddingHash,
    indexedAt: row.indexedAt,
  };
}

function mapLanguage(value: string): StoredKnowledgeChunk["language"] {
  if (
    value === "ENGLISH" ||
    value === "GREEK" ||
    value === "GREEKLISH" ||
    value === "MIXED"
  ) {
    return value;
  }
  return "UNKNOWN";
}

function toMetadata(value: Prisma.JsonValue): StoredKnowledgeChunk["metadata"] {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as StoredKnowledgeChunk["metadata"])
    : {
        source: "business_context_item",
        sourceItemId: "unknown",
        section: "CUSTOM_NOTES",
        locale: null,
        policyMode: "indexed",
        indexedFields: [],
        structuredPrimary: true,
      };
}

import { Prisma } from "@/generated/prisma/client";
import {
  createEmbeddingProviderFromEnv,
  embeddingHash,
  type EmbeddingProvider,
} from "@/lib/knowledge/embedding-provider";
import { buildKnowledgeChunks } from "@/lib/knowledge/chunking";
import type {
  BusinessContextRecord,
  BusinessContextSectionValue,
  PublicationStatusValue,
} from "@/lib/knowledge/types";
import type { KnowledgeChunk } from "@/lib/knowledge/retrieval-types";
import { safeErrorMessage } from "@/lib/security/logging";
import { getPrismaClient } from "@/server/db";

type PrismaClientLike = ReturnType<typeof getPrismaClient>;

export async function scheduleKnowledgeItemIndexing(input: {
  organizationId: string;
  itemId: string;
  reason: string;
  prisma?: PrismaClientLike;
}) {
  const prisma = input.prisma ?? getPrismaClient();
  return prisma.knowledgeIndexJob.create({
    data: {
      organizationId: input.organizationId,
      itemId: input.itemId,
      jobType: "UPSERT_ITEM",
      reason: input.reason,
    },
  });
}

export async function refreshKnowledgeItemIndex(input: {
  organizationId: string;
  itemId: string;
  reason: string;
  provider?: EmbeddingProvider;
}) {
  const prisma = getPrismaClient();
  const job = await scheduleKnowledgeItemIndexing({
    organizationId: input.organizationId,
    itemId: input.itemId,
    reason: input.reason,
    prisma,
  });

  return processKnowledgeIndexJob({
    jobId: job.id,
    provider: input.provider,
  });
}

export async function processKnowledgeIndexJob(input: {
  jobId: string;
  provider?: EmbeddingProvider;
}) {
  const prisma = getPrismaClient();
  const provider = input.provider ?? createEmbeddingProviderFromEnv();
  const job = await prisma.knowledgeIndexJob.findUnique({
    where: { id: input.jobId },
  });

  if (!job) throw new Error("Knowledge index job not found.");
  if (!job.itemId && job.jobType !== "REINDEX_WORKSPACE") {
    return markJobSkipped({
      jobId: job.id,
      reason: "Job has no source item.",
      prisma,
    });
  }

  await prisma.knowledgeIndexJob.update({
    where: { id: job.id },
    data: {
      status: "RUNNING",
      attemptCount: { increment: 1 },
      startedAt: new Date(),
      errorMessage: null,
    },
  });

  try {
    const result =
      job.jobType === "REINDEX_WORKSPACE"
        ? await reindexWorkspace({
            organizationId: job.organizationId,
            provider,
          })
        : await indexBusinessContextItem({
            organizationId: job.organizationId,
            itemId: job.itemId!,
            provider,
          });

    await prisma.knowledgeIndexJob.update({
      where: { id: job.id },
      data: {
        status: result.status,
        finishedAt: new Date(),
        metadata: toJson(result.metadata),
      },
    });

    console.info("northline.knowledge.index_job.completed", {
      jobId: job.id,
      organizationId: job.organizationId,
      itemId: job.itemId,
      status: result.status,
      chunks: result.metadata.chunkCount,
      provider: result.metadata.provider,
      fallbackReason: result.metadata.fallbackReason,
    });

    return result;
  } catch (error) {
    const message = safeErrorMessage(error);
    await prisma.knowledgeIndexJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: message,
        finishedAt: new Date(),
      },
    });
    console.error("northline.knowledge.index_job.failed", {
      jobId: job.id,
      organizationId: job.organizationId,
      itemId: job.itemId,
      error: message,
    });
    throw error;
  }
}

export async function reindexWorkspaceKnowledge(input: {
  organizationId: string;
  reason: string;
  provider?: EmbeddingProvider;
}) {
  const prisma = getPrismaClient();
  const job = await prisma.knowledgeIndexJob.create({
    data: {
      organizationId: input.organizationId,
      jobType: "REINDEX_WORKSPACE",
      reason: input.reason,
    },
  });
  return processKnowledgeIndexJob({ jobId: job.id, provider: input.provider });
}

export async function processPendingKnowledgeIndexJobs(input: {
  organizationId?: string;
  limit?: number;
  provider?: EmbeddingProvider;
} = {}) {
  const prisma = getPrismaClient();
  const jobs = await prisma.knowledgeIndexJob.findMany({
    where: {
      organizationId: input.organizationId,
      status: "PENDING",
    },
    orderBy: { createdAt: "asc" },
    take: input.limit ?? 25,
  });
  const results = [];

  for (const job of jobs) {
    results.push(
      await processKnowledgeIndexJob({
        jobId: job.id,
        provider: input.provider,
      }),
    );
  }

  return results;
}

async function reindexWorkspace(input: {
  organizationId: string;
  provider: EmbeddingProvider;
}) {
  const prisma = getPrismaClient();
  const items = await prisma.businessContextItem.findMany({
    where: {
      organizationId: input.organizationId,
      status: { not: "ARCHIVED" },
    },
  });

  let chunkCount = 0;
  let fallbackReason: string | undefined;
  for (const item of items) {
    const result = await indexBusinessContextItem({
      organizationId: input.organizationId,
      itemId: item.id,
      provider: input.provider,
    });
    chunkCount += result.metadata.chunkCount;
    fallbackReason ??= result.metadata.fallbackReason;
  }

  return {
    status: "SUCCEEDED" as const,
    metadata: {
      chunkCount,
      itemCount: items.length,
      provider: input.provider.name,
      model: input.provider.model,
      fallbackReason,
    },
  };
}

async function indexBusinessContextItem(input: {
  organizationId: string;
  itemId: string;
  provider: EmbeddingProvider;
}) {
  const prisma = getPrismaClient();
  const item = await prisma.businessContextItem.findFirst({
    where: {
      id: input.itemId,
      organizationId: input.organizationId,
    },
  });

  if (!item) {
    await prisma.businessKnowledgeChunk.updateMany({
      where: {
        itemId: input.itemId,
        organizationId: input.organizationId,
        chunkStatus: "ACTIVE",
      },
      data: { chunkStatus: "ARCHIVED" },
    });
    return {
      status: "SKIPPED" as const,
      metadata: {
        chunkCount: 0,
        provider: input.provider.name,
        fallbackReason: "Source item was deleted or is inaccessible.",
      },
    };
  }

  const chunks = buildKnowledgeChunks(mapBusinessContextItem(item)).map(
    (chunk) => ({ ...chunk, organizationId: input.organizationId }),
  );

  if (chunks.length === 0) {
    await prisma.businessKnowledgeChunk.updateMany({
      where: {
        itemId: item.id,
        organizationId: input.organizationId,
        chunkStatus: "ACTIVE",
      },
      data: {
        chunkStatus: item.status === "ARCHIVED" ? "ARCHIVED" : "STALE",
        publicationStatus: item.status,
      },
    });
    return {
      status: "SKIPPED" as const,
      metadata: {
        chunkCount: 0,
        provider: input.provider.name,
        fallbackReason:
          item.status === "PUBLISHED"
            ? "Section is structured-only."
            : "Only published knowledge is retrieval-indexed.",
      },
    };
  }

  const existing = await prisma.businessKnowledgeChunk.findMany({
    where: {
      organizationId: input.organizationId,
      itemId: item.id,
    },
  });
  const existingByIndex = new Map(
    existing.map((chunk) => [chunk.chunkIndex, chunk]),
  );
  const embedded = await embedChangedChunks({
    chunks,
    existingByIndex,
    provider: input.provider,
  });

  await prisma.$transaction(async (tx) => {
    const activeIndexes = new Set(chunks.map((chunk) => chunk.chunkIndex));
    await tx.businessKnowledgeChunk.updateMany({
      where: {
        organizationId: input.organizationId,
        itemId: item.id,
        chunkIndex: { notIn: Array.from(activeIndexes) },
        chunkStatus: "ACTIVE",
      },
      data: { chunkStatus: "STALE" },
    });

    for (const chunk of embedded.chunks) {
      await tx.businessKnowledgeChunk.upsert({
        where: {
          itemId_chunkIndex: {
            itemId: item.id,
            chunkIndex: chunk.chunkIndex,
          },
        },
        create: chunkCreateData({
          chunk,
          organizationId: input.organizationId,
          itemStatus: item.status,
        }),
        update: chunkUpdateData({
          chunk,
          itemStatus: item.status,
        }),
      });
    }
  });

  return {
    status: "SUCCEEDED" as const,
    metadata: {
      chunkCount: chunks.length,
      provider: embedded.providerName,
      model: embedded.model,
      dimensions: embedded.dimensions,
      fallbackReason: embedded.fallbackReason,
    },
  };
}

async function embedChangedChunks(input: {
  chunks: Array<KnowledgeChunk & { organizationId: string }>;
  existingByIndex: Map<number, {
    contentHash: string;
    embedding: number[];
    embeddingProvider: string | null;
    embeddingModel: string | null;
    embeddingDimensions: number | null;
    embeddingHash: string | null;
    indexedAt: Date | null;
  }>;
  provider: EmbeddingProvider;
}) {
  if (!input.provider.isEnabled) {
    return {
      chunks: input.chunks.map((chunk) => ({
        ...chunk,
        embedding: [],
        embeddingProvider: input.provider.name,
        embeddingModel: input.provider.model,
        embeddingDimensions: 0,
        embeddingHash: null,
        indexedAt: new Date(),
      })),
      providerName: input.provider.name,
      model: input.provider.model,
      dimensions: 0,
      fallbackReason: "Embedding provider disabled; indexed lexical chunks only.",
    };
  }

  const reused = new Map<number, {
    embedding: number[];
    embeddingProvider: string;
    embeddingModel: string;
    embeddingDimensions: number;
    embeddingHash: string | null;
    indexedAt: Date | null;
  }>();
  const changed = input.chunks.filter((chunk) => {
    const existing = input.existingByIndex.get(chunk.chunkIndex);
    const canReuse =
      existing?.contentHash === chunk.contentHash &&
      existing.embedding.length > 0 &&
      existing.embeddingProvider === input.provider.name &&
      existing.embeddingModel === input.provider.model;
    if (canReuse) {
      reused.set(chunk.chunkIndex, {
        embedding: existing.embedding,
        embeddingProvider: existing.embeddingProvider!,
        embeddingModel: existing.embeddingModel!,
        embeddingDimensions: existing.embeddingDimensions ?? existing.embedding.length,
        embeddingHash: existing.embeddingHash,
        indexedAt: existing.indexedAt,
      });
    }
    return !canReuse;
  });

  try {
    const response =
      changed.length > 0
        ? await input.provider.embed({ texts: changed.map((chunk) => chunk.searchText) })
        : {
            embeddings: [],
            model: input.provider.model,
            dimensions: input.provider.dimensions ?? 0,
          };
    const embeddedChanged = new Map(
      changed.map((chunk, index) => [
        chunk.chunkIndex,
        {
          embedding: response.embeddings[index],
          embeddingProvider: input.provider.name,
          embeddingModel: response.model,
          embeddingDimensions: response.dimensions,
          embeddingHash: embeddingHash({
            provider: input.provider.name,
            model: response.model,
            text: chunk.searchText,
          }),
          indexedAt: new Date(),
        },
      ]),
    );

    return {
      chunks: input.chunks.map((chunk) => ({
        ...chunk,
        ...(reused.get(chunk.chunkIndex) ?? embeddedChanged.get(chunk.chunkIndex)!),
      })),
      providerName: input.provider.name,
      model: response.model,
      dimensions: response.dimensions,
      fallbackReason: undefined,
    };
  } catch (error) {
    const fallbackReason = `Embedding failed; indexed lexical chunks only: ${safeErrorMessage(error)}`;
    console.warn("northline.knowledge.embedding.fallback", {
      provider: input.provider.name,
      model: input.provider.model,
      fallbackReason,
    });
    return {
      chunks: input.chunks.map((chunk) => ({
        ...chunk,
        embedding: [],
        embeddingProvider: input.provider.name,
        embeddingModel: input.provider.model,
        embeddingDimensions: 0,
        embeddingHash: null,
        indexedAt: new Date(),
      })),
      providerName: input.provider.name,
      model: input.provider.model,
      dimensions: 0,
      fallbackReason,
    };
  }
}

function chunkCreateData(input: {
  chunk: EmbeddedKnowledgeChunk;
  organizationId: string;
  itemStatus: PublicationStatusValue;
}) {
  return {
    organizationId: input.organizationId,
    itemId: input.chunk.itemId,
    section: input.chunk.section,
    locale: input.chunk.locale,
    publicationStatus: input.itemStatus,
    chunkStatus: "ACTIVE" as const,
    chunkIndex: input.chunk.chunkIndex,
    title: input.chunk.title,
    text: input.chunk.text,
    normalizedText: input.chunk.normalizedText,
    searchText: input.chunk.searchText,
    language: input.chunk.language,
    contentHash: input.chunk.contentHash,
    tokensEstimate: input.chunk.tokensEstimate,
    metadata: toJson(input.chunk.metadata),
    embedding: input.chunk.embedding,
    embeddingProvider: input.chunk.embeddingProvider,
    embeddingModel: input.chunk.embeddingModel,
    embeddingDimensions: input.chunk.embeddingDimensions,
    embeddingHash: input.chunk.embeddingHash,
    indexedAt: input.chunk.indexedAt,
  };
}

function chunkUpdateData(input: {
  chunk: EmbeddedKnowledgeChunk;
  itemStatus: PublicationStatusValue;
}) {
  return {
    section: input.chunk.section,
    locale: input.chunk.locale,
    publicationStatus: input.itemStatus,
    chunkStatus: "ACTIVE" as const,
    title: input.chunk.title,
    text: input.chunk.text,
    normalizedText: input.chunk.normalizedText,
    searchText: input.chunk.searchText,
    language: input.chunk.language,
    contentHash: input.chunk.contentHash,
    tokensEstimate: input.chunk.tokensEstimate,
    metadata: toJson(input.chunk.metadata),
    embedding: input.chunk.embedding,
    embeddingProvider: input.chunk.embeddingProvider,
    embeddingModel: input.chunk.embeddingModel,
    embeddingDimensions: input.chunk.embeddingDimensions,
    embeddingHash: input.chunk.embeddingHash,
    indexedAt: input.chunk.indexedAt,
  };
}

function mapBusinessContextItem(row: {
  id: string;
  section: string;
  locale: string | null;
  title: string;
  rawText: string;
  normalizedText: string;
  structuredData: Prisma.JsonValue;
  status: string;
  updatedAt: Date;
}): BusinessContextRecord {
  return {
    id: row.id,
    section: row.section as BusinessContextSectionValue,
    locale: row.locale as "EN" | "EL" | null,
    title: row.title,
    rawText: row.rawText,
    normalizedText: row.normalizedText,
    structuredData: toObject(row.structuredData),
    status: row.status as PublicationStatusValue,
    updatedAt: row.updatedAt,
  };
}

async function markJobSkipped(input: {
  jobId: string;
  reason: string;
  prisma: PrismaClientLike;
}) {
  await input.prisma.knowledgeIndexJob.update({
    where: { id: input.jobId },
    data: {
      status: "SKIPPED",
      errorMessage: input.reason,
      finishedAt: new Date(),
    },
  });
  return {
    status: "SKIPPED" as const,
    metadata: {
      chunkCount: 0,
      fallbackReason: input.reason,
    },
  };
}

function toObject(value: Prisma.JsonValue) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toJson(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

type EmbeddedKnowledgeChunk = KnowledgeChunk & {
  organizationId: string;
  embedding: number[];
  embeddingProvider: string;
  embeddingModel: string;
  embeddingDimensions: number;
  embeddingHash: string | null;
  indexedAt: Date | null;
};

import { describe, expect, it } from "vitest";
import { MockEmbeddingProvider } from "@/lib/knowledge/embedding-provider";
import { buildKnowledgeChunks } from "@/lib/knowledge/chunking";
import { assembleBusinessContextBundle } from "@/lib/knowledge/context";
import { mergeCurrentRetrievalChunks } from "@/lib/knowledge/retrieval-fallback";
import { rankKnowledgeChunks } from "@/lib/knowledge/retrieval-ranking";
import type {
  BusinessContextRecord,
  BusinessContextSectionValue,
} from "@/lib/knowledge/types";
import type { StoredKnowledgeChunk } from "@/lib/knowledge/retrieval-types";

const workspace = {
  name: "Northline Demo",
  primaryMarket: "GR",
  defaultLocale: "EN" as const,
  languageMode: "BILINGUAL",
};

describe("knowledge retrieval pipeline", () => {
  it("chunks retrieval-suitable content and excludes structured-only rules", () => {
    const chunks = [
      item({
        id: "faq_1",
        section: "FAQ",
        title: "Setup timeline",
        structuredData: {
          question: "How fast can we start?",
          answer: "Most implementations start after a discovery call.",
        },
      }),
      item({
        id: "qualification_1",
        section: "QUALIFICATION_RULES",
        title: "Required fields",
        structuredData: {
          rule: "Ask for budget before handoff.",
          priority: "High",
        },
      }),
      item({
        id: "escalation_1",
        section: "ESCALATION_RULES",
        title: "Handoff",
        structuredData: {
          trigger: "Lead asks for a person.",
          destination: "Owner inbox",
        },
      }),
    ].flatMap((record) => buildKnowledgeChunks(record));

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({
      itemId: "faq_1",
      section: "FAQ",
      metadata: {
        structuredPrimary: true,
        policyMode: "indexed",
      },
    });
  });

  it("ranks pricing notes above nearby service content for pricing questions", async () => {
    const chunks = await storedChunks([
      item({
        id: "service_1",
        section: "SERVICES",
        title: "AI sales assistant",
        structuredData: {
          name: "AI sales assistant",
          summary: "Captures inbound leads and books discovery calls.",
          availability: "Athens and remote EU customers.",
        },
      }),
      item({
        id: "pricing_1",
        section: "PRICING",
        title: "Implementation pricing",
        structuredData: {
          priceModel: "Implementation cost starts from EUR 500 per month.",
          notes: "Final pricing depends on scope and must be confirmed by the team.",
          doNotSay: "Do not promise discounts.",
        },
      }),
    ]);

    const result = rankKnowledgeChunks({
      query: {
        organizationId: "org_1",
        query: "How much does implementation cost?",
        topK: 2,
      },
      chunks,
      queryEmbedding: chunks[1].embedding,
      provider: {
        name: "mock",
        model: "northline-mock-embedding",
        enabled: true,
        used: true,
      },
    });

    expect(result.hits[0].chunk.itemId).toBe("pricing_1");
    expect(result.hits[0].breakdown.lexical).toBeGreaterThan(0);
    expect(result.hits[0].reasons.join(" ")).toContain("matched");
  });

  it("prefers Greek content for Greeklish queries while keeping mixed-language fallback", async () => {
    const chunks = await storedChunks([
      item({
        id: "faq_en",
        section: "FAQ",
        title: "English pricing",
        locale: "EN",
        structuredData: {
          question: "How much does it cost?",
          answer: "Pricing is confirmed after discovery.",
        },
      }),
      item({
        id: "faq_el",
        section: "FAQ",
        title: "Greek pricing",
        locale: "EL",
        structuredData: {
          question: "Πόσο κοστίζει;",
          answer: "Η τιμή επιβεβαιώνεται μετά από σύντομη συζήτηση.",
        },
      }),
    ]);

    const result = rankKnowledgeChunks({
      query: {
        organizationId: "org_1",
        query: "poso kostos exei?",
        preferredLocale: "EL",
        topK: 2,
      },
      chunks,
      provider: {
        name: "disabled",
        enabled: false,
        used: false,
        fallbackReason: "lexical fallback test",
      },
    });

    expect(result.debug.queryLanguage).toBe("GREEKLISH");
    expect(result.hits[0].chunk.itemId).toBe("faq_el");
    expect(result.hits[0].breakdown.language).toBe(1);
  });

  it("adds retrieval hits to the context packet without dropping structured warnings", () => {
    const service = item({
      id: "service_1",
      section: "SERVICES",
      title: "AI sales assistant",
      structuredData: {
        name: "AI sales assistant",
        summary: "Captures inbound leads and books discovery calls.",
      },
    });
    const pricing = item({
      id: "pricing_1",
      section: "PRICING",
      title: "Pricing",
      structuredData: {
        priceModel: "Cost depends on scope.",
        notes: "Confirm pricing with the team.",
      },
    });
    const bundle = assembleBusinessContextBundle({
      workspace,
      items: [service, pricing],
      retrieval: {
        query: "cost",
        generatedAt: "2026-04-27T10:00:00.000Z",
        provider: {
          name: "mock",
          enabled: true,
          used: true,
        },
        hits: [
          {
            chunkId: "chunk_1",
            itemId: "pricing_1",
            section: "PRICING",
            title: "Pricing",
            locale: "EN",
            text: "Cost depends on scope.",
            score: 0.82,
            rank: 1,
            reasons: ["query terms matched"],
          },
        ],
      },
    });

    expect(bundle.retrieval?.hits[0].itemId).toBe("pricing_1");
    expect(bundle.assistantContext).toContain(
      "Retrieved context for the latest message",
    );
    expect(bundle.assistantContext).toContain("Missing published FAQs.");
    expect(
      bundle.sections.find((section) => section.section === "PRICING")
        ?.entries[0].retrievalScore,
    ).toBe(0.82);
  });

  it("uses current structured chunks when persisted retrieval rows are stale or missing", async () => {
    const oldPricing = item({
      id: "pricing_1",
      section: "PRICING",
      title: "Legacy pricing",
      structuredData: {
        priceModel: "Old implementation cost was EUR 300 per month.",
      },
    });
    const currentPricing = item({
      id: "pricing_1",
      section: "PRICING",
      title: "Current pricing",
      structuredData: {
        priceModel: "Current implementation cost starts from EUR 500 per month.",
      },
    });
    const currentFaq = item({
      id: "faq_1",
      section: "FAQ",
      title: "Setup timing",
      structuredData: {
        question: "When can we start?",
        answer: "Most teams start after a discovery call.",
      },
    });
    const persistedChunks = await storedChunks([
      oldPricing,
      item({
        id: "archived_service",
        section: "SERVICES",
        title: "Archived service",
        structuredData: {
          name: "Retired plan",
          summary: "This plan should no longer be used.",
        },
      }),
    ]);
    const transientChunks = await storedChunks([currentPricing, currentFaq]);

    const merged = mergeCurrentRetrievalChunks({
      persistedChunks,
      transientChunks,
      currentItemIds: ["pricing_1", "faq_1"],
    });

    expect(merged.map((chunk) => chunk.itemId)).toEqual([
      "pricing_1",
      "faq_1",
    ]);
    expect(merged[0].title).toBe("Current pricing");
    expect(merged[0].text).toContain("EUR 500");
    expect(merged.some((chunk) => chunk.itemId === "archived_service")).toBe(
      false,
    );
  });
});

async function storedChunks(items: BusinessContextRecord[]) {
  const provider = new MockEmbeddingProvider(64);
  const chunks = items.flatMap((record) => buildKnowledgeChunks(record));
  const response = await provider.embed({
    texts: chunks.map((chunk) => chunk.searchText),
  });

  return chunks.map((chunk, index): StoredKnowledgeChunk => ({
    ...chunk,
    id: `chunk_${index}`,
    organizationId: "org_1",
    embedding: response.embeddings[index],
    embeddingProvider: provider.name,
    embeddingModel: response.model,
    embeddingDimensions: response.dimensions,
    embeddingHash: `hash_${index}`,
    indexedAt: new Date("2026-04-27T09:00:00.000Z"),
  }));
}

function item(input: {
  id: string;
  section: BusinessContextSectionValue;
  title: string;
  structuredData: Record<string, unknown>;
  locale?: "EN" | "EL" | null;
}): BusinessContextRecord {
  const rawText = `${input.section}: ${input.title}`;
  return {
    id: input.id,
    section: input.section,
    locale: "locale" in input ? (input.locale ?? null) : "EN",
    title: input.title,
    rawText,
    normalizedText: rawText,
    structuredData: input.structuredData,
    status: "PUBLISHED",
    updatedAt: new Date("2026-04-27T08:00:00.000Z"),
  };
}

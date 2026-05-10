import type {
  BusinessContextRecord,
  BusinessContextSectionValue,
} from "@/lib/knowledge/types";

export type RetrievalLanguage = "ENGLISH" | "GREEK" | "GREEKLISH" | "MIXED" | "UNKNOWN";

export type KnowledgeRetrievalMode =
  | "indexed"
  | "indexed_for_clarification"
  | "structured_only";

export type KnowledgeSectionIndexPolicy = {
  section: BusinessContextSectionValue;
  mode: KnowledgeRetrievalMode;
  indexedFields: string[];
  rationale: string;
  decisionBoundary: string;
};

export type KnowledgeChunk = {
  organizationId?: string;
  itemId: string;
  section: BusinessContextSectionValue;
  locale: "EN" | "EL" | null;
  chunkIndex: number;
  title: string;
  text: string;
  normalizedText: string;
  searchText: string;
  language: RetrievalLanguage;
  contentHash: string;
  tokensEstimate: number;
  metadata: KnowledgeChunkMetadata;
};

export type KnowledgeChunkMetadata = {
  source: "business_context_item";
  sourceItemId: string;
  section: BusinessContextSectionValue;
  locale: "EN" | "EL" | null;
  policyMode: KnowledgeRetrievalMode;
  indexedFields: string[];
  structuredPrimary: true;
  sourceUpdatedAt?: string;
};

export type StoredKnowledgeChunk = KnowledgeChunk & {
  id: string;
  embedding: number[];
  embeddingProvider: string | null;
  embeddingModel: string | null;
  embeddingDimensions: number | null;
  embeddingHash: string | null;
  indexedAt: Date | null;
};

export type KnowledgeQuery = {
  organizationId: string;
  query: string;
  preferredLocale?: "EN" | "EL" | null;
  topK?: number;
  minScore?: number;
  sections?: BusinessContextSectionValue[];
};

export type KnowledgeRetrievalHit = {
  chunk: StoredKnowledgeChunk;
  score: number;
  rank: number;
  breakdown: {
    vector: number;
    lexical: number;
    language: number;
    section: number;
    freshness: number;
  };
  matchedTerms: string[];
  reasons: string[];
};

export type KnowledgeRetrievalDebug = {
  queryLanguage: RetrievalLanguage;
  normalizedQuery: string;
  searchQuery: string;
  provider: {
    name: string;
    model?: string;
    enabled: boolean;
    used: boolean;
    fallbackReason?: string;
  };
  candidateCount: number;
  returnedCount: number;
};

export type KnowledgeRetrievalResult = {
  query: KnowledgeQuery;
  hits: KnowledgeRetrievalHit[];
  debug: KnowledgeRetrievalDebug;
};

export type KnowledgeContextAssemblyInput = {
  organizationId: string;
  workspace: {
    name: string;
    websiteUrl?: string | null;
    primaryMarket: string;
    defaultLocale: "EN" | "EL";
    languageMode: string;
  };
  items: BusinessContextRecord[];
  query: string;
  preferredLocale?: "EN" | "EL" | null;
  topK?: number;
};

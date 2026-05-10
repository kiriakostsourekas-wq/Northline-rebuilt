import { analyzeText } from "@/lib/language/normalization";
import { indexedKnowledgeSections } from "@/lib/knowledge/retrieval-policy";
import type {
  KnowledgeQuery,
  KnowledgeRetrievalHit,
  KnowledgeRetrievalResult,
  RetrievalLanguage,
  StoredKnowledgeChunk,
} from "@/lib/knowledge/retrieval-types";

const defaultTopK = 6;
const defaultMinScore = 0.16;

export function rankKnowledgeChunks(input: {
  query: KnowledgeQuery;
  chunks: StoredKnowledgeChunk[];
  queryEmbedding?: number[] | null;
  provider: {
    name: string;
    model?: string;
    enabled: boolean;
    used: boolean;
    fallbackReason?: string;
  };
}): KnowledgeRetrievalResult {
  const analysis = analyzeText(input.query.query);
  const queryLanguage = mapLanguage(analysis.detection.language);
  const normalizedQuery = analysis.normalizedText;
  const searchQuery = analysis.searchText;
  const requestedSections = input.query.sections ?? indexedKnowledgeSections();
  const queryTerms = uniqueTerms(searchQuery);

  const candidates = input.chunks.filter((chunk) =>
    requestedSections.includes(chunk.section),
  );
  const scored = candidates
    .map((chunk) =>
      scoreChunk({
        chunk,
        query: input.query,
        queryTerms,
        queryLanguage,
        queryEmbedding: input.queryEmbedding,
      }),
    )
    .filter((hit) => hit.score >= (input.query.minScore ?? defaultMinScore))
    .sort((a, b) => b.score - a.score)
    .slice(0, input.query.topK ?? defaultTopK)
    .map((hit, index) => ({ ...hit, rank: index + 1 }));

  return {
    query: input.query,
    hits: scored,
    debug: {
      queryLanguage,
      normalizedQuery,
      searchQuery,
      provider: input.provider,
      candidateCount: candidates.length,
      returnedCount: scored.length,
    },
  };
}

function scoreChunk(input: {
  chunk: StoredKnowledgeChunk;
  query: KnowledgeQuery;
  queryTerms: string[];
  queryLanguage: RetrievalLanguage;
  queryEmbedding?: number[] | null;
}): KnowledgeRetrievalHit {
  const vector = vectorScore(input.queryEmbedding, input.chunk.embedding);
  const lexical = lexicalScore(input.queryTerms, input.chunk.searchText);
  const language = languageScore({
    queryLanguage: input.queryLanguage,
    preferredLocale: input.query.preferredLocale,
    chunk: input.chunk,
  });
  const section = sectionScore(input.queryTerms, input.chunk.section);
  const freshness = input.chunk.indexedAt ? 0.03 : 0;
  const matchingTerms = matchedTerms(input.queryTerms, input.chunk.searchText);
  const score = clamp(
    vector * 0.58 + lexical * 0.3 + language * 0.08 + section * 0.04 + freshness,
    0,
    1,
  );

  return {
    chunk: input.chunk,
    score: round(score),
    rank: 0,
    breakdown: {
      vector: round(vector),
      lexical: round(lexical),
      language: round(language),
      section: round(section),
      freshness: round(freshness),
    },
    matchedTerms: matchingTerms,
    reasons: reasonsFor({ vector, lexical, language, section, matchedTerms: matchingTerms }),
  };
}

function vectorScore(queryEmbedding: number[] | null | undefined, embedding: number[]) {
  if (!queryEmbedding?.length || !embedding.length) return 0;
  if (queryEmbedding.length !== embedding.length) return 0;
  return clamp(cosineSimilarity(queryEmbedding, embedding), 0, 1);
}

function lexicalScore(queryTerms: string[], searchText: string) {
  if (queryTerms.length === 0) return 0;
  const chunkTerms = new Set(searchText.split(/\s+/).filter(Boolean));
  const matches = queryTerms.filter((term) => chunkTerms.has(term));
  const coverage = matches.length / queryTerms.length;
  const phraseBoost = queryTerms.length > 1 && searchText.includes(queryTerms.join(" "))
    ? 0.16
    : 0;
  return clamp(coverage + phraseBoost, 0, 1);
}

function languageScore(input: {
  queryLanguage: RetrievalLanguage;
  preferredLocale?: "EN" | "EL" | null;
  chunk: StoredKnowledgeChunk;
}) {
  if (!input.chunk.locale) return 0.72;
  const queryLocale =
    input.queryLanguage === "GREEK" || input.queryLanguage === "GREEKLISH"
      ? "EL"
      : input.queryLanguage === "ENGLISH"
        ? "EN"
        : input.preferredLocale;

  if (!queryLocale) return 0.55;
  if (input.chunk.locale === queryLocale) return 1;
  return input.queryLanguage === "MIXED" ? 0.52 : 0.18;
}

function sectionScore(queryTerms: string[], section: string) {
  const joined = queryTerms.join(" ");
  if (section === "PRICING" && /price|pricing|cost|quote|budget|τιμη|κοστοσ|ποσο/.test(joined)) {
    return 1;
  }
  if (section === "BOOKING_RULES" && /book|booking|demo|call|ραντεβου|ραντεβου|rantevou/.test(joined)) {
    return 1;
  }
  if (section === "OPENING_HOURS" && /hours|open|closed|ωρεσ|ωραριο|ανοιχτα/.test(joined)) {
    return 1;
  }
  if (section === "LOCATIONS" && /where|area|location|athens|greece|περιοχη|αθηνα|ελλαδα/.test(joined)) {
    return 1;
  }
  if (section === "FAQ" && /how|what|can|do|faq|πως|τι|μπορω/.test(joined)) {
    return 0.7;
  }
  return 0;
}

function matchedTerms(queryTerms: string[], searchText: string) {
  const chunkTerms = new Set(searchText.split(/\s+/).filter(Boolean));
  return queryTerms.filter((term) => chunkTerms.has(term)).slice(0, 12);
}

function reasonsFor(input: {
  vector: number;
  lexical: number;
  language: number;
  section: number;
  matchedTerms: string[];
}) {
  const reasons: string[] = [];
  if (input.vector > 0.6) reasons.push("strong vector similarity");
  else if (input.vector > 0.25) reasons.push("some vector similarity");
  if (input.lexical > 0.45) reasons.push("query terms matched");
  if (input.language > 0.8) reasons.push("language match");
  if (input.section > 0) reasons.push("section intent boost");
  if (input.matchedTerms.length > 0) {
    reasons.push(`matched: ${input.matchedTerms.join(", ")}`);
  }
  return reasons.length ? reasons : ["low-confidence fallback match"];
}

function uniqueTerms(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) => term.length > 1 && !stopWords.has(term)),
    ),
  );
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    aMagnitude += a[index] * a[index];
    bMagnitude += b[index] * b[index];
  }
  if (!aMagnitude || !bMagnitude) return 0;
  return dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
}

function mapLanguage(language: string): RetrievalLanguage {
  if (language === "ENGLISH") return "ENGLISH";
  if (language === "GREEK") return "GREEK";
  if (language === "GREEKLISH") return "GREEKLISH";
  if (language === "MIXED") return "MIXED";
  return "UNKNOWN";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "you",
  "your",
  "this",
  "that",
  "can",
  "are",
  "στο",
  "στη",
  "στην",
  "και",
  "για",
  "μου",
  "σασ",
  "μασ",
]);

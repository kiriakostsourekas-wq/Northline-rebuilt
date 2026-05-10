import {
  getCriticalSections,
  getSectionConfig,
  sectionConfigs,
} from "@/lib/knowledge/sections";
import type {
  BusinessContextBundle,
  BusinessContextRecord,
  BusinessContextRetrievalPacket,
} from "@/lib/knowledge/types";

type WorkspaceContextInput = {
  name: string;
  websiteUrl?: string | null;
  primaryMarket: string;
  defaultLocale: "EN" | "EL";
  languageMode: string;
};

export function assembleBusinessContextBundle(input: {
  workspace: WorkspaceContextInput;
  items: BusinessContextRecord[];
  generatedAt?: Date;
  retrieval?: BusinessContextRetrievalPacket;
}): BusinessContextBundle {
  const publishedItems = input.items
    .filter((item) => item.status === "PUBLISHED")
    .sort((a, b) => sectionOrder(a.section) - sectionOrder(b.section));
  const retrievalRanks = retrievalRankMap(input.retrieval);
  const warnings = buildSetupWarnings(publishedItems);
  const sections = sectionConfigs.map((config) => ({
    section: config.section,
    label: config.label,
    entries: publishedItems
      .filter((item) => item.section === config.section)
      .sort((a, b) => retrievalSort(a, b, retrievalRanks))
      .map((item) => ({
        id: item.id,
        title: item.title,
        locale: item.locale,
        text: item.normalizedText,
        structuredData: item.structuredData,
        retrievalScore: retrievalRanks.get(item.id)?.score,
      })),
  }));
  const languages = resolveLanguages(
    input.workspace.defaultLocale,
    publishedItems,
  );

  return {
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    workspace: input.workspace,
    languages,
    warnings,
    sections,
    retrieval: input.retrieval,
    assistantContext: renderAssistantContext({
      workspace: input.workspace,
      sections,
      warnings,
      retrieval: input.retrieval,
    }),
  };
}

export function buildSetupWarnings(items: BusinessContextRecord[]) {
  const warnings: string[] = [];
  const publishedSections = new Set(items.map((item) => item.section));

  for (const section of getCriticalSections()) {
    if (!publishedSections.has(section)) {
      warnings.push(
        `Missing published ${formatWarningLabel(getSectionConfig(section).label)}.`,
      );
    }
  }

  const hasAnyGreek = items.some((item) => item.locale === "EL");
  const hasAnyEnglish = items.some((item) => item.locale === "EN");
  if (!hasAnyGreek) warnings.push("No published Greek business context yet.");
  if (!hasAnyEnglish) {
    warnings.push("No published English business context yet.");
  }

  return warnings;
}

function renderAssistantContext(input: {
  workspace: WorkspaceContextInput;
  sections: BusinessContextBundle["sections"];
  warnings: string[];
  retrieval?: BusinessContextRetrievalPacket;
}) {
  const lines = [
    `Workspace: ${input.workspace.name}`,
    `Primary market: ${input.workspace.primaryMarket}`,
    `Default language: ${input.workspace.defaultLocale}`,
    `Language mode: ${input.workspace.languageMode}`,
    input.workspace.websiteUrl ? `Website: ${input.workspace.websiteUrl}` : null,
    "",
    "Use only the published business context below. If information is missing or unclear, ask a concise follow-up question or hand off according to escalation rules.",
  ].filter(Boolean) as string[];

  if (input.warnings.length > 0) {
    lines.push("", "Setup warnings:");
    for (const warning of input.warnings) lines.push(`- ${warning}`);
  }

  if (input.retrieval?.hits.length) {
    lines.push("", "Retrieved context for the latest message:");
    for (const hit of input.retrieval.hits) {
      const language = hit.locale ? ` [${hit.locale}]` : " [mixed]";
      lines.push(
        `- #${hit.rank} ${hit.title}${language} (${hit.section}, score ${hit.score})`,
      );
      lines.push(hit.text);
      if (hit.reasons.length) lines.push(`Why matched: ${hit.reasons.join("; ")}`);
    }
  }

  for (const section of input.sections) {
    if (section.entries.length === 0) continue;
    lines.push("", `## ${section.label}`);
    for (const entry of section.entries) {
      const language = entry.locale ? ` [${entry.locale}]` : " [mixed]";
      lines.push(`- ${entry.title}${language}`);
      lines.push(entry.text);
    }
  }

  return lines.join("\n");
}

function resolveLanguages(
  defaultLocale: "EN" | "EL",
  items: BusinessContextRecord[],
) {
  const languages = new Set<"EN" | "EL">([defaultLocale]);
  for (const item of items) {
    if (item.locale === "EN" || item.locale === "EL") languages.add(item.locale);
  }
  return Array.from(languages);
}

function sectionOrder(section: string) {
  const index = sectionConfigs.findIndex((config) => config.section === section);
  return index === -1 ? 999 : index;
}

function retrievalRankMap(retrieval?: BusinessContextRetrievalPacket) {
  const ranks = new Map<string, { rank: number; score: number }>();
  for (const hit of retrieval?.hits ?? []) {
    const existing = ranks.get(hit.itemId);
    if (!existing || hit.rank < existing.rank) {
      ranks.set(hit.itemId, { rank: hit.rank, score: hit.score });
    }
  }
  return ranks;
}

function retrievalSort(
  a: BusinessContextRecord,
  b: BusinessContextRecord,
  ranks: Map<string, { rank: number; score: number }>,
) {
  const rankA = ranks.get(a.id)?.rank ?? 9999;
  const rankB = ranks.get(b.id)?.rank ?? 9999;
  if (rankA !== rankB) return rankA - rankB;
  return 0;
}

function formatWarningLabel(label: string) {
  return label === "FAQs" ? label : label.toLowerCase();
}

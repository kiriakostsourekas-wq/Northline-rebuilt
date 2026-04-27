import {
  getCriticalSections,
  getSectionConfig,
  sectionConfigs,
} from "@/lib/knowledge/sections";
import type {
  BusinessContextBundle,
  BusinessContextRecord,
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
}): BusinessContextBundle {
  const publishedItems = input.items
    .filter((item) => item.status === "PUBLISHED")
    .sort((a, b) => sectionOrder(a.section) - sectionOrder(b.section));
  const warnings = buildSetupWarnings(publishedItems);
  const sections = sectionConfigs.map((config) => ({
    section: config.section,
    label: config.label,
    entries: publishedItems
      .filter((item) => item.section === config.section)
      .map((item) => ({
        id: item.id,
        title: item.title,
        locale: item.locale,
        text: item.normalizedText,
        structuredData: item.structuredData,
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
    assistantContext: renderAssistantContext({
      workspace: input.workspace,
      sections,
      warnings,
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

function formatWarningLabel(label: string) {
  return label === "FAQs" ? label : label.toLowerCase();
}

import { getSectionConfig } from "@/lib/knowledge/sections";
import type {
  BusinessContextSectionValue,
  KnowledgeItemInput,
  KnowledgeLocale,
  KnowledgeValidationResult,
  PublicationStatusValue,
} from "@/lib/knowledge/types";

const statuses = new Set<PublicationStatusValue>([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

export function validateKnowledgeItemInput(
  input: KnowledgeItemInput,
): KnowledgeValidationResult {
  const sectionConfig = getSectionConfig(input.section);
  const errors: string[] = [];
  const title = normalizeWhitespace(input.title);
  const status = statuses.has(input.status) ? input.status : "DRAFT";
  const locale = normalizeLocale(input.locale);
  const structuredData: Record<string, string> = {};

  if (!title) errors.push("Add a clear title.");

  for (const field of sectionConfig.fields) {
    const value = normalizeWhitespace(input.fields[field.key] ?? "");
    structuredData[field.key] = value;
    if (field.required && !value) {
      errors.push(`${field.label} is required.`);
    }
  }

  const rawText = buildRawText(input.section, title, structuredData);
  const normalizedText = normalizeForContext(rawText);

  if (normalizedText.length < 12) {
    errors.push("Add enough detail for the assistant to use this safely.");
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      section: input.section,
      locale,
      status,
      title,
      structuredData,
      rawText,
      normalizedText,
    },
  };
}

export function normalizeForContext(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
    .join("\n");
}

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeLocale(locale?: KnowledgeLocale) {
  if (locale === "EN" || locale === "EL") return locale;
  return null;
}

function buildRawText(
  section: BusinessContextSectionValue,
  title: string,
  fields: Record<string, string>,
) {
  const config = getSectionConfig(section);
  const lines = [`${config.label}: ${title}`];

  for (const field of config.fields) {
    const value = fields[field.key];
    if (value) lines.push(`${field.label}: ${value}`);
  }

  return lines.join("\n");
}

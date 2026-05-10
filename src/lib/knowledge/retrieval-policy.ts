import { getSectionConfig } from "@/lib/knowledge/sections";
import type { BusinessContextSectionValue } from "@/lib/knowledge/types";
import type {
  KnowledgeSectionIndexPolicy,
  KnowledgeRetrievalMode,
} from "@/lib/knowledge/retrieval-types";

export const knowledgeSectionIndexPolicies: Record<
  BusinessContextSectionValue,
  KnowledgeSectionIndexPolicy
> = {
  BUSINESS_PROFILE: {
    section: "BUSINESS_PROFILE",
    mode: "indexed",
    indexedFields: ["description", "idealCustomers", "tone"],
    rationale:
      "Helpful for general business questions, but workspace profile remains structured context.",
    decisionBoundary:
      "May support answer wording; must not override workspace identity or language settings.",
  },
  SERVICES: {
    section: "SERVICES",
    mode: "indexed",
    indexedFields: ["name", "summary", "availability"],
    rationale: "Service and product details are common lead questions.",
    decisionBoundary:
      "May support service explanations; qualification state still follows the playbook.",
  },
  PRICING: {
    section: "PRICING",
    mode: "indexed",
    indexedFields: ["priceModel", "notes", "doNotSay"],
    rationale: "Pricing notes need precise retrieval to avoid broad context noise.",
    decisionBoundary:
      "May support approved pricing language; must not create quotes, discounts, or guarantees.",
  },
  FAQ: {
    section: "FAQ",
    mode: "indexed",
    indexedFields: ["question", "answer"],
    rationale: "FAQs are the highest-value retrieval surface.",
    decisionBoundary:
      "May answer known FAQs; missing or low-confidence FAQ matches should trigger clarification.",
  },
  LOCATIONS: {
    section: "LOCATIONS",
    mode: "indexed",
    indexedFields: ["locationName", "address", "notes"],
    rationale: "Locations and service areas benefit from query-specific matching.",
    decisionBoundary:
      "May support location answers; allowed service area decisions remain structured and auditable.",
  },
  OPENING_HOURS: {
    section: "OPENING_HOURS",
    mode: "indexed",
    indexedFields: ["timezone", "hours", "exceptions"],
    rationale: "Hours and exceptions are retrieval-suitable operational facts.",
    decisionBoundary:
      "May explain hours; booking slot eligibility still uses booking workflow rules.",
  },
  QUALIFICATION_RULES: {
    section: "QUALIFICATION_RULES",
    mode: "structured_only",
    indexedFields: [],
    rationale: "Qualification transitions must remain deterministic and inspectable.",
    decisionBoundary:
      "Used by structured playbooks and context warnings, not retrieval ranking.",
  },
  BOOKING_RULES: {
    section: "BOOKING_RULES",
    mode: "indexed_for_clarification",
    indexedFields: ["bookingPath", "duration", "constraints"],
    rationale:
      "Booking wording can clarify customer questions, but eligibility cannot come from retrieval alone.",
    decisionBoundary:
      "May support booking explanations; booking eligibility and side effects remain workflow-owned.",
  },
  ESCALATION_RULES: {
    section: "ESCALATION_RULES",
    mode: "structured_only",
    indexedFields: [],
    rationale: "Handoff policy is a controlled action boundary.",
    decisionBoundary:
      "Used by handoff rules and context warnings, not retrieval ranking.",
  },
  CUSTOM_NOTES: {
    section: "CUSTOM_NOTES",
    mode: "indexed",
    indexedFields: ["note"],
    rationale: "Custom policies and approved wording are retrieval-suitable.",
    decisionBoundary:
      "May support approved business claims; must not authorize actions by itself.",
  },
};

export function getKnowledgeSectionIndexPolicy(
  section: BusinessContextSectionValue,
): KnowledgeSectionIndexPolicy {
  return knowledgeSectionIndexPolicies[section];
}

export function isRetrievalIndexedSection(
  section: BusinessContextSectionValue,
): boolean {
  return knowledgeSectionIndexPolicies[section].mode !== "structured_only";
}

export function indexedKnowledgeSections(): BusinessContextSectionValue[] {
  return Object.values(knowledgeSectionIndexPolicies)
    .filter((policy) => policy.mode !== "structured_only")
    .map((policy) => policy.section);
}

export function structuredOnlyKnowledgeSections(): BusinessContextSectionValue[] {
  return Object.values(knowledgeSectionIndexPolicies)
    .filter((policy) => policy.mode === "structured_only")
    .map((policy) => policy.section);
}

export function renderIndexableBusinessText(input: {
  section: BusinessContextSectionValue;
  title: string;
  structuredData: Record<string, unknown>;
}): string {
  const policy = getKnowledgeSectionIndexPolicy(input.section);
  if (policy.mode === "structured_only") return "";

  const config = getSectionConfig(input.section);
  const fieldLabels = new Map(
    config.fields.map((field) => [field.key, field.label]),
  );
  const lines = [`${config.label}: ${input.title}`];

  for (const key of policy.indexedFields) {
    const value = stringifyField(input.structuredData[key]);
    if (value) lines.push(`${fieldLabels.get(key) ?? key}: ${value}`);
  }

  lines.push(`Retrieval use: ${policy.decisionBoundary}`);
  return lines.join("\n");
}

export function retrievalModeLabel(mode: KnowledgeRetrievalMode): string {
  if (mode === "indexed_for_clarification") return "indexed for clarification";
  if (mode === "structured_only") return "structured only";
  return "indexed";
}

function stringifyField(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyField(item))
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

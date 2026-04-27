export const businessContextSections = [
  "BUSINESS_PROFILE",
  "SERVICES",
  "PRICING",
  "FAQ",
  "LOCATIONS",
  "OPENING_HOURS",
  "QUALIFICATION_RULES",
  "BOOKING_RULES",
  "ESCALATION_RULES",
  "CUSTOM_NOTES",
] as const;

export type BusinessContextSectionValue =
  (typeof businessContextSections)[number];

export type KnowledgeLocale = "EN" | "EL" | "MIXED";
export type PublicationStatusValue = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type SectionField = {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  multiline?: boolean;
};

export type SectionConfig = {
  section: BusinessContextSectionValue;
  label: string;
  shortLabel: string;
  description: string;
  critical: boolean;
  fields: SectionField[];
};

export type KnowledgeItemInput = {
  section: BusinessContextSectionValue;
  locale?: KnowledgeLocale;
  status: PublicationStatusValue;
  title: string;
  fields: Record<string, string>;
};

export type KnowledgeValidationResult =
  | {
      ok: true;
      value: {
        section: BusinessContextSectionValue;
        locale: "EN" | "EL" | null;
        status: PublicationStatusValue;
        title: string;
        structuredData: Record<string, string>;
        rawText: string;
        normalizedText: string;
      };
    }
  | { ok: false; errors: string[] };

export type BusinessContextRecord = {
  id: string;
  section: BusinessContextSectionValue;
  locale: "EN" | "EL" | null;
  title: string;
  rawText: string;
  normalizedText: string;
  structuredData: Record<string, unknown>;
  status: PublicationStatusValue;
  updatedAt?: Date;
};

export type BusinessContextBundle = {
  generatedAt: string;
  workspace: {
    name: string;
    websiteUrl?: string | null;
    primaryMarket: string;
    defaultLocale: "EN" | "EL";
    languageMode: string;
  };
  languages: Array<"EN" | "EL">;
  warnings: string[];
  sections: Array<{
    section: BusinessContextSectionValue;
    label: string;
    entries: Array<{
      id: string;
      title: string;
      locale: "EN" | "EL" | null;
      text: string;
      structuredData: Record<string, unknown>;
    }>;
  }>;
  assistantContext: string;
};

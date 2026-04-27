import { describe, expect, it } from "vitest";
import {
  assembleBusinessContextBundle,
  buildSetupWarnings,
} from "@/lib/knowledge/context";
import type {
  BusinessContextRecord,
  BusinessContextSectionValue,
  PublicationStatusValue,
} from "@/lib/knowledge/types";

const workspace = {
  name: "Northline Demo",
  websiteUrl: "https://preview.northline.local",
  primaryMarket: "GR",
  defaultLocale: "EN" as const,
  languageMode: "BILINGUAL",
};

describe("business context assembly", () => {
  it("excludes drafts from the generated assistant context", () => {
    const bundle = assembleBusinessContextBundle({
      workspace,
      generatedAt: new Date("2026-04-26T10:00:00.000Z"),
      items: [
        makeItem({
          id: "published_faq",
          section: "FAQ",
          title: "Booking question",
          text: "FAQ: Booking question\nQuestion: Can I book?\nAnswer: Yes.",
          status: "PUBLISHED",
        }),
        makeItem({
          id: "draft_service",
          section: "SERVICES",
          title: "Draft service",
          text: "Services or products: Draft service",
          status: "DRAFT",
        }),
      ],
    });

    expect(bundle.generatedAt).toBe("2026-04-26T10:00:00.000Z");
    expect(bundle.assistantContext).toContain("Booking question");
    expect(bundle.assistantContext).not.toContain("Draft service");
    expect(
      bundle.sections.find((section) => section.section === "SERVICES")
        ?.entries,
    ).toHaveLength(0);
  });

  it("warns when critical sections or approved languages are missing", () => {
    const warnings = buildSetupWarnings([
      makeItem({
        section: "BUSINESS_PROFILE",
        title: "Profile",
        text: "Business profile: Profile",
        locale: null,
      }),
    ]);

    expect(warnings).toContain("Missing published services or products.");
    expect(warnings).toContain("Missing published FAQs.");
    expect(warnings).toContain("No published Greek business context yet.");
    expect(warnings).toContain("No published English business context yet.");
  });

  it("resolves Greek and English as first-class context languages", () => {
    const bundle = assembleBusinessContextBundle({
      workspace,
      items: [
        makeItem({
          section: "BUSINESS_PROFILE",
          title: "English profile",
          text: "Business profile: English profile",
          locale: "EN",
        }),
        makeItem({
          section: "SERVICES",
          title: "Greek service",
          text: "Services or products: Greek service",
          locale: "EL",
        }),
      ],
    });

    expect(bundle.languages).toEqual(["EN", "EL"]);
    expect(bundle.assistantContext).toContain("English profile [EN]");
    expect(bundle.assistantContext).toContain("Greek service [EL]");
  });

  it("produces warnings-free output when critical sections are published", () => {
    const items = [
      makeItem({
        section: "BUSINESS_PROFILE",
        title: "Profile",
        text: "Business profile: Profile",
        locale: "EN",
      }),
      makeItem({
        section: "SERVICES",
        title: "Service",
        text: "Services or products: Service",
        locale: "EL",
      }),
      makeItem({
        section: "FAQ",
        title: "FAQ",
        text: "FAQs: FAQ",
        locale: "EN",
      }),
      makeItem({
        section: "QUALIFICATION_RULES",
        title: "Qualification",
        text: "Lead qualification rules: Qualification",
        locale: "EN",
      }),
      makeItem({
        section: "BOOKING_RULES",
        title: "Booking",
        text: "Booking rules: Booking",
        locale: "EN",
      }),
      makeItem({
        section: "ESCALATION_RULES",
        title: "Escalation",
        text: "Escalation rules: Escalation",
        locale: "EN",
      }),
    ];

    expect(buildSetupWarnings(items)).toEqual([]);
  });
});

function makeItem(input: {
  id?: string;
  section: BusinessContextSectionValue;
  title: string;
  text: string;
  locale?: "EN" | "EL" | null;
  status?: PublicationStatusValue;
}): BusinessContextRecord {
  return {
    id: input.id ?? `${input.section.toLowerCase()}_1`,
    section: input.section,
    locale: "locale" in input ? (input.locale ?? null) : "EN",
    title: input.title,
    rawText: input.text,
    normalizedText: input.text,
    structuredData: { text: input.text },
    status: input.status ?? "PUBLISHED",
    updatedAt: new Date("2026-04-26T09:00:00.000Z"),
  };
}

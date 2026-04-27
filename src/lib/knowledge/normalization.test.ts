import { describe, expect, it } from "vitest";
import {
  normalizeForContext,
  validateKnowledgeItemInput,
} from "@/lib/knowledge/normalization";

describe("knowledge item validation", () => {
  it("requires section-specific critical fields", () => {
    const result = validateKnowledgeItemInput({
      section: "FAQ",
      status: "PUBLISHED",
      locale: "EN",
      title: "Getting started",
      fields: {
        question: "How fast can we start?",
        answer: "",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("Answer is required.");
    }
  });

  it("normalizes fields into raw and AI-ready text", () => {
    const result = validateKnowledgeItemInput({
      section: "SERVICES",
      status: "PUBLISHED",
      locale: "EL",
      title: "  Demo   setup ",
      fields: {
        name: "  Northline demo  ",
        summary: "Lead capture\n\nand booking setup.",
        availability: "Greece and Europe",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.locale).toBe("EL");
      expect(result.value.title).toBe("Demo setup");
      expect(result.value.structuredData).toMatchObject({
        name: "Northline demo",
        summary: "Lead capture and booking setup.",
      });
      expect(result.value.normalizedText).toContain(
        "What it includes: Lead capture and booking setup.",
      );
    }
  });

  it("keeps mixed-language entries language-neutral", () => {
    const result = validateKnowledgeItemInput({
      section: "CUSTOM_NOTES",
      status: "DRAFT",
      locale: "MIXED",
      title: "Approved wording",
      fields: {
        note: "Reply in the language the lead used.",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.locale).toBeNull();
    }
  });

  it("collapses whitespace without losing line boundaries", () => {
    expect(normalizeForContext(" One   line \n\n Two\t\tline ")).toBe(
      "One line\nTwo line",
    );
  });
});

import { describe, expect, it } from "vitest";
import {
  analyzeText,
  detectLanguage,
  extractEntities,
  includesNormalized,
  transliterateGreeklishText,
} from "@/lib/language";

describe("language handling", () => {
  it("detects Greek-only business messages and preserves display text", () => {
    const text =
      "Καλησπέρα, θέλω ραντεβού αύριο στις 14:30 στην Αθήνα. Το email μου είναι maria@example.com.";
    const analysis = analyzeText(text);
    const entities = extractEntities(analysis);

    expect(analysis.rawText).toBe(text);
    expect(analysis.displayText).toBe(text);
    expect(analysis.detection.language).toBe("GREEK");
    expect(analysis.normalizedText).toContain("καλησπερα");
    expect(entities.emails).toEqual(["maria@example.com"]);
    expect(entities.dateTimes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ normalized: "tomorrow" }),
        expect.objectContaining({ normalized: "14:30" }),
      ]),
    );
    expect(entities.locations).toContain("Athens");
  });

  it("detects English-only messages", () => {
    const detection = detectLanguage(
      "Hello, can I book a demo next week for our Athens office?",
    );

    expect(detection.language).toBe("ENGLISH");
    expect(detection.confidence).toBeGreaterThan(0.6);
  });

  it("handles Greeklish with useful transliteration and extraction", () => {
    const text =
      "Kalispera, thelo rantevou avrio stin Athina. Tilefono +30 690 111 2222";
    const analysis = analyzeText(text);
    const entities = extractEntities(analysis);

    expect(analysis.detection.language).toBe("GREEKLISH");
    expect(transliterateGreeklishText("thelo rantevou stin Athina")).toContain(
      "θέλω ραντεβού",
    );
    expect(analysis.searchText).toContain("ραντεβου");
    expect(entities.phones).toEqual(["+306901112222"]);
    expect(entities.dateTimes).toEqual(
      expect.arrayContaining([expect.objectContaining({ normalized: "tomorrow" })]),
    );
    expect(entities.locations).toContain("Athens");
  });

  it("detects mixed Greek and English messages", () => {
    const analysis = analyzeText(
      "Hi, ενδιαφέρομαι για demo next week στην Αθήνα",
    );

    expect(analysis.detection.language).toBe("MIXED");
    expect(analysis.searchText).toContain("demo");
    expect(analysis.searchText).toContain("ενδιαφερομαι");
  });

  it("handles short fragments without overclaiming confidence", () => {
    const ok = detectLanguage("ok");
    expect(ok.language).toBe("ENGLISH");
    expect(ok.confidence).toBeLessThan(0.7);
    expect(detectLanguage("??").language).toBe("UNKNOWN");
  });

  it("matches Greek text without requiring tonos fidelity", () => {
    expect(includesNormalized("Ποια είναι η τιμή;", "τιμη")).toBe(true);
    expect(includesNormalized("Θέλω προσφορά", "θελω")).toBe(true);
  });
});

import { detectLanguage } from "@/lib/language/detection";
import { transliterateGreeklishText } from "@/lib/language/greeklish";
import type { TextAnalysis } from "@/lib/language/types";

const tonosMap: Record<string, string> = {
  ά: "α",
  έ: "ε",
  ή: "η",
  ί: "ι",
  ΐ: "ι",
  ό: "ο",
  ύ: "υ",
  ΰ: "υ",
  ώ: "ω",
  Ά: "α",
  Έ: "ε",
  Ή: "η",
  Ί: "ι",
  Ό: "ο",
  Ύ: "υ",
  Ώ: "ω",
};

export function analyzeText(value: string): TextAnalysis {
  const rawText = value;
  const displayText = normalizeForDisplay(value);
  const detection = detectLanguage(displayText);
  const greeklishText =
    detection.language === "GREEKLISH" || detection.language === "MIXED"
      ? normalizeForMatching(transliterateGreeklishText(displayText))
      : null;
  const normalizedText = normalizeForMatching(displayText);
  const searchText = uniqueParts([normalizedText, greeklishText]).join(" ");

  return {
    rawText,
    displayText,
    normalizedText,
    searchText,
    greeklishText,
    detection,
  };
}

export function normalizeForDisplay(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export function normalizeForMatching(value: string) {
  return stripGreekTonos(value)
    .toLowerCase()
    .replace(/ς/g, "σ")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}@+.:/\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripGreekTonos(value: string) {
  return value
    .split("")
    .map((char) => tonosMap[char] ?? char)
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function includesNormalized(haystack: string, needle: string) {
  return normalizeForMatching(haystack).includes(normalizeForMatching(needle));
}

function uniqueParts(parts: Array<string | null>) {
  return Array.from(new Set(parts.filter(Boolean))) as string[];
}

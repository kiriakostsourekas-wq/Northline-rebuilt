import type { EngineLocale } from "@/lib/conversation-engine/types";
import { analyzeText } from "@/lib/language";

export function detectMessageLocale(
  message: string,
  defaultLocale: EngineLocale,
): EngineLocale {
  const analysis = analyzeText(message);
  if (
    analysis.detection.language === "GREEK" ||
    analysis.detection.language === "GREEKLISH"
  ) {
    return "EL";
  }
  if (analysis.detection.language === "MIXED") {
    return analysis.detection.greekCharacters > 0 ||
      analysis.detection.greeklishSignals.length > 0
      ? "EL"
      : defaultLocale;
  }
  if (analysis.detection.language === "ENGLISH") return "EN";
  return defaultLocale;
}

export function resolveReplyLocale(input: {
  message: string;
  defaultLocale: EngineLocale;
  languageMode: string;
}): EngineLocale {
  if (input.languageMode === "GREEK") return "EL";
  if (input.languageMode === "ENGLISH") return "EN";
  return detectMessageLocale(input.message, input.defaultLocale);
}

import { greeklishSignals } from "@/lib/language/greeklish";
import type { DetectedLanguage, LanguageDetection } from "@/lib/language/types";

const englishSignalWords = [
  "hello",
  "hi",
  "price",
  "pricing",
  "cost",
  "book",
  "demo",
  "call",
  "meeting",
  "service",
  "available",
  "email",
  "phone",
  "ok",
];

export function detectLanguage(value: string): LanguageDetection {
  const signalText = value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, " ")
    .replace(/https?:\/\/\S+/gi, " ");
  const greekCharacters = signalText.match(/[\u0370-\u03ff]/g)?.length ?? 0;
  const latinCharacters = signalText.match(/[a-z]/gi)?.length ?? 0;
  const greeklish = greeklishSignals(signalText);
  const englishSignals = detectEnglishSignals(signalText);
  const totalLetters = greekCharacters + latinCharacters;

  if (totalLetters === 0) {
    return result("UNKNOWN", 0.1, greekCharacters, latinCharacters, greeklish, englishSignals);
  }

  const greekRatio = greekCharacters / totalLetters;
  const latinRatio = latinCharacters / totalLetters;

  if (greekRatio > 0.18 && latinRatio > 0.18) {
    return result("MIXED", 0.78, greekCharacters, latinCharacters, greeklish, englishSignals);
  }
  if (greekRatio >= 0.35) {
    return result("GREEK", clamp(0.65 + greekRatio * 0.3), greekCharacters, latinCharacters, greeklish, englishSignals);
  }
  if (greeklish.length >= 2 && englishSignals.length <= greeklish.length + 1) {
    return result("GREEKLISH", 0.72, greekCharacters, latinCharacters, greeklish, englishSignals);
  }
  if (englishSignals.length > 0 || latinCharacters > 2) {
    return result("ENGLISH", clamp(0.55 + englishSignals.length * 0.08), greekCharacters, latinCharacters, greeklish, englishSignals);
  }

  return result("UNKNOWN", 0.25, greekCharacters, latinCharacters, greeklish, englishSignals);
}

function detectEnglishSignals(value: string) {
  const lower = value.toLowerCase();
  return englishSignalWords.filter((word) => lower.includes(word));
}

function result(
  language: DetectedLanguage,
  confidence: number,
  greekCharacters: number,
  latinCharacters: number,
  greeklish: string[],
  englishSignals: string[],
): LanguageDetection {
  return {
    language,
    confidence: Math.round(confidence * 100) / 100,
    greekCharacters,
    latinCharacters,
    greeklishSignals: greeklish,
    englishSignals,
  };
}

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 0.98);
}

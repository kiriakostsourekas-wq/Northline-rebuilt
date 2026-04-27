import { analyzeText, includesNormalized } from "@/lib/language/normalization";
import type { ExtractedDateTime, ExtractedEntities, TextAnalysis } from "@/lib/language/types";

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phonePattern = /(?:\+?\d[\d\s().-]{7,}\d)/g;

const knownLocations = [
  { canonical: "Athens", terms: ["athens", "αθηνα", "athina"] },
  { canonical: "Thessaloniki", terms: ["thessaloniki", "θεσσαλονικη"] },
  { canonical: "Patras", terms: ["patras", "πατρα", "patra"] },
  { canonical: "Heraklion", terms: ["heraklion", "ηρακλειο", "iraklio"] },
  { canonical: "Piraeus", terms: ["piraeus", "πειραιασ", "peiraias"] },
  { canonical: "Greece", terms: ["greece", "ελλαδα", "ellada"] },
  { canonical: "Europe", terms: ["europe", "ευρωπη", "evropi"] },
];

export function extractEntities(value: string | TextAnalysis): ExtractedEntities {
  const analysis = typeof value === "string" ? analyzeText(value) : value;

  return {
    names: extractNames(analysis),
    phones: extractPhoneNumbers(analysis.rawText),
    emails: extractEmails(analysis.rawText),
    dateTimes: extractDateTimes(analysis),
    locations: extractLocations(analysis),
  };
}

export function extractEmails(value: string) {
  return Array.from(value.matchAll(emailPattern)).map((match) =>
    match[0].toLowerCase(),
  );
}

export function extractPhoneNumbers(value: string) {
  return Array.from(value.matchAll(phonePattern))
    .map((match) => match[0].replace(/[^\d+]/g, ""))
    .filter((phone) => phone.replace(/[^\d]/g, "").length >= 8);
}

export function extractNames(value: string | TextAnalysis) {
  const analysis = typeof value === "string" ? analyzeText(value) : value;
  const display = analysis.displayText;
  const patterns = [
    /\bmy name is\s+([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[A-Z]\.?)){0,2})/i,
    /\bi am\s+([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[A-Z]\.?)){0,2})/i,
    /\bthis is\s+([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[A-Z]\.?)){0,2})/i,
    /\bμε λένε\s+([\p{L}]+(?:\s+[\p{L}]+){0,2})/iu,
    /\bείμαι\s+(?:ο|η)?\s*([\p{L}]+(?:\s+[\p{L}]+){0,2})/iu,
  ];

  for (const pattern of patterns) {
    const value = display.match(pattern)?.[1];
    if (value) return [cleanupName(value)];
  }

  const greeklishName = analysis.searchText.match(/\b(?:me lene|eimai)\s+([a-z]{3,}(?:\s+[a-z]{2,}){0,2})/i)?.[1];
  return greeklishName ? [cleanupName(greeklishName)] : [];
}

export function extractDateTimes(value: string | TextAnalysis) {
  const analysis = typeof value === "string" ? analyzeText(value) : value;
  const text = analysis.searchText;
  const results: ExtractedDateTime[] = [];
  const relativeTerms: Array<[string, string]> = [
    ["today", "today"],
    ["tomorrow", "tomorrow"],
    ["this week", "this week"],
    ["next week", "next week"],
    ["this month", "this month"],
    ["next month", "next month"],
    ["σημερα", "today"],
    ["αυριο", "tomorrow"],
    ["αυτη την εβδομαδα", "this week"],
    ["επομενη εβδομαδα", "next week"],
    ["simera", "today"],
    ["avrio", "tomorrow"],
  ];

  for (const [term, normalized] of relativeTerms) {
    if (text.includes(term)) {
      results.push({ raw: term, normalized, kind: "RELATIVE" });
    }
  }

  for (const match of analysis.displayText.matchAll(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g)) {
    results.push({
      raw: match[0],
      normalized: `${match[1].padStart(2, "0")}:${match[2]}`,
      kind: "TIME",
    });
  }

  for (const match of analysis.displayText.matchAll(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g)) {
    results.push({ raw: match[0], normalized: match[0], kind: "DATE" });
  }

  return dedupeDateTimes(results);
}

export function extractLocations(value: string | TextAnalysis) {
  const analysis = typeof value === "string" ? analyzeText(value) : value;
  const matches = knownLocations
    .filter((location) =>
      location.terms.some(
        (term) =>
          includesNormalized(analysis.searchText, term) ||
          includesNormalized(analysis.displayText, term),
      ),
    )
    .map((location) => location.canonical);

  return Array.from(new Set(matches));
}

function dedupeDateTimes(values: ExtractedDateTime[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = `${value.kind}:${value.normalized}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cleanupName(value: string) {
  return value
    .split(/[.!?,]/)[0]
    .replace(/\s+/g, " ")
    .trim();
}

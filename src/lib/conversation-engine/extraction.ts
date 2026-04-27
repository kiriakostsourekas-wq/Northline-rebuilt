import type { BusinessContextBundle } from "@/lib/knowledge/types";
import type { ExtractedLeadFields } from "@/lib/conversation-engine/types";
import {
  analyzeText,
  extractDateTimes,
  extractEmails,
  extractLocations,
  extractNames,
  extractPhoneNumbers,
  normalizeForMatching,
} from "@/lib/language";

export function extractLeadFields(input: {
  message: string;
  contact?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  businessContext: BusinessContextBundle;
}): ExtractedLeadFields {
  const analysis = analyzeText(input.message);
  const message = analysis.displayText;
  const searchText = analysis.searchText;
  const extracted: ExtractedLeadFields = {};
  const email = extractEmails(analysis.rawText)[0] ?? input.contact?.email;
  const phone =
    extractPhoneNumbers(analysis.rawText)[0] ??
    normalizePhone(input.contact?.phone);

  if (email) extracted.email = email.toLowerCase();
  if (phone) extracted.phone = phone;

  const name =
    extractNames(analysis)[0] ??
    extractName(message) ??
    input.contact?.name ??
    undefined;
  if (name) extracted.name = name;

  const preferredContactMethod = extractPreferredContactMethod(message);
  if (preferredContactMethod) {
    extracted.preferredContactMethod = preferredContactMethod;
  }

  const serviceInterest = extractServiceInterest(
    { displayText: message, searchText },
    input.businessContext,
  );
  if (serviceInterest) extracted.serviceInterest = serviceInterest;

  const budget = extractBudget(message, searchText);
  if (budget) extracted.budget = budget;

  const location = extractLocations(analysis)[0] ?? extractLocation(message);
  if (location) extracted.location = location;

  const urgency = extractUrgency(message, searchText);
  if (urgency) extracted.urgency = urgency;

  if (hasBookingSignal(searchText)) extracted.bookingIntent = true;
  const dateTimes = extractDateTimes(analysis);
  extracted.freeformNotes = dateTimes.length
    ? `${message}\nDetected timing: ${dateTimes.map((item) => item.normalized).join(", ")}`
    : message;

  return extracted;
}

function extractName(message: string) {
  const patterns = [
    /\bmy name is\s+([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[A-Z]\.?)){0,2})/i,
    /\bi am\s+([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[A-Z]\.?)){0,2})/i,
    /\bthis is\s+([A-Z][a-z]+(?:\s+(?:[A-Z][a-z]+|[A-Z]\.?)){0,2})/i,
    /\bμε λένε\s+([\p{L}]+(?:\s+[\p{L}]+){0,2})/iu,
    /\bείμαι\s+(?:ο|η)?\s*([\p{L}]+(?:\s+[\p{L}]+){0,2})/iu,
  ];

  for (const pattern of patterns) {
    const value = message.match(pattern)?.[1]?.trim();
    if (value && !/interested|looking|from|for|ενδιαφέρομαι/i.test(value)) {
      return cleanupName(value);
    }
  }

  return null;
}

function extractPreferredContactMethod(message: string) {
  const normalized = normalizeForMatching(message);
  if (/\b(whatsapp|viber|messenger|instagram|dm|message|μηνυμα)\b/i.test(normalized)) {
    return "messaging";
  }
  if (/\b(email|mail)\b/i.test(normalized)) {
    return "email";
  }
  if (/\b(phone|call|τηλεφωνο|κληση|tilefono)\b/i.test(normalized)) {
    return "phone";
  }
  return null;
}

function extractServiceInterest(
  message: { displayText: string; searchText: string },
  businessContext: BusinessContextBundle,
) {
  const candidates = serviceCandidates(businessContext);
  const normalizedMessage = message.searchText;
  const matched = candidates.find((candidate) =>
    normalizedMessage.includes(normalizeForMatching(candidate)),
  );
  if (matched) return matched;

  const patterns = [
    /\b(?:interested in|need|looking for|want)\s+([^.!?\n]{3,80})/i,
    /\b(?:ενδιαφέρομαι για|χρειάζομαι|ψάχνω για|θέλω)\s+([^.!?\n]{3,80})/iu,
    /\b(?:endiaferomai gia|xreiazomai|psaxno gia|thelo)\s+([^.!?\n]{3,80})/i,
  ];
  for (const pattern of patterns) {
    const value = message.displayText.match(pattern)?.[1]?.trim();
    if (value) return cleanup(value);
  }

  return null;
}

function extractBudget(message: string, searchText: string) {
  const match =
    message.match(/(?:budget|around|up to|έως|μέχρι)\s*(?:is|είναι)?\s*([€$]?\s?\d[\d.,]*(?:\s?(?:eur|euro|euros|€|ευρώ))?)/i) ??
    message.match(/([€$]\s?\d[\d.,]*|\d[\d.,]*\s?(?:eur|euro|euros|€|ευρώ))/i) ??
    searchText.match(/(?:budget|kostos|timi|προυπολογισμοσ)\s*([€$]?\s?\d[\d.,]*)/i);

  return match?.[1] ? cleanup(match[1]) : null;
}

function extractLocation(message: string) {
  const knownLocations = [
    "Athens",
    "Thessaloniki",
    "Patras",
    "Heraklion",
    "Αθήνα",
    "Θεσσαλονίκη",
    "Πάτρα",
    "Ηράκλειο",
  ];
  const known = knownLocations.find((location) =>
    normalizeForMatching(message).includes(normalizeForMatching(location)),
  );
  if (known) return known;

  const patterns = [
    /\b(?:in|near|around|based in|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i,
    /\b(?:στο|στην|στη|στον|περιοχή)\s+([\p{L}]+(?:\s+[\p{L}]+){0,2})/iu,
  ];
  for (const pattern of patterns) {
    const value = message.match(pattern)?.[1]?.trim();
    const location = value
      ? cleanup(value).replace(/\b(this|next|within|week|month|today|tomorrow)\b.*$/i, "").trim()
      : null;
    if (location && !/touch|contact|mind/i.test(location)) return location;
  }
  return null;
}

function extractUrgency(message: string, searchText: string) {
  if (/\b(asap|urgent|today|tomorrow|immediately|now|σημερα|αυριο|αμεσα|επείγον|amesa|avrio)\b/i.test(searchText)) {
    return "immediate";
  }
  if (/\b(this week|next week|within a week|αυτη την εβδομαδα|επομενη εβδομαδα)\b/i.test(searchText)) {
    return "this week";
  }
  if (/\b(this month|next month|within a month|μηνα)\b/i.test(searchText)) {
    return "this month";
  }
  if (/\b(σήμερα|αύριο|άμεσα|επείγον)\b/i.test(message)) return "άμεσα";
  if (/\b(αυτή την εβδομάδα|την επόμενη εβδομάδα)\b/i.test(message)) {
    return "αυτή την εβδομάδα";
  }
  if (/\b(exploring|researching|not sure|later)\b/i.test(message)) {
    return "exploring";
  }
  return null;
}

function hasBookingSignal(message: string) {
  return /\b(book|booking|schedule|appointment|meeting|demo|call|ραντεβου|κλεισω|συναντηση|rantevou|kleiso)\b/i.test(
    message,
  );
}

function serviceCandidates(bundle: BusinessContextBundle) {
  const serviceSection = bundle.sections.find(
    (section) => section.section === "SERVICES",
  );
  if (!serviceSection) return [];

  return serviceSection.entries.flatMap((entry) => {
    const values = [
      entry.title,
      stringValue(entry.structuredData.name),
      stringValue(entry.structuredData.summary),
    ].filter(Boolean);
    return values.map((value) => value.slice(0, 80));
  });
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value?: string | null) {
  if (!value) return undefined;
  const normalized = value.replace(/[^\d+]/g, "");
  return normalized.length >= 8 ? normalized : undefined;
}

function cleanup(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[,.!?;:]+$/g, "")
    .trim();
}

function cleanupName(value: string) {
  return cleanup(value.split(/[.!?,]/)[0]);
}

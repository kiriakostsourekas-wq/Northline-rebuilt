import type {
  ConversationEngineDecision,
  EngineLocale,
  ExtractedLeadFields,
  LeadFieldKey,
  LeadSnapshot,
} from "@/lib/conversation-engine/types";

const maxFieldLength = 180;

export function canUseGeneratedReply(decision: ConversationEngineDecision) {
  return !decision.shouldEscalate && decision.state.stage !== "ESCALATED";
}

export function validateGeneratedReply(input: {
  reply: string;
  locale: EngineLocale;
  decision: ConversationEngineDecision;
}): { ok: true; value: string } | { ok: false; reason: string } {
  const reply = input.reply.trim();
  if (!reply) return { ok: false, reason: "empty reply" };
  if (reply.length > 700) return { ok: false, reason: "reply too long" };
  if (hasUnsupportedPromise(reply)) {
    return { ok: false, reason: "unsupported promise" };
  }
  if (input.decision.shouldEscalate && !handoffAware(reply)) {
    return { ok: false, reason: "handoff reply does not acknowledge routing" };
  }
  if (input.locale === "EL" && /I\b|I'll|Thanks\b/i.test(reply)) {
    return { ok: false, reason: "reply locale mismatch" };
  }
  return { ok: true, value: reply };
}

export function sanitizeExtractedFields(
  fields: ExtractedLeadFields,
): ExtractedLeadFields {
  const sanitized: ExtractedLeadFields = {};

  if (validText(fields.name)) sanitized.name = cleanup(fields.name);
  if (validEmail(fields.email)) sanitized.email = cleanup(fields.email).toLowerCase();
  if (validPhone(fields.phone)) sanitized.phone = cleanup(fields.phone);
  if (validText(fields.preferredContactMethod)) {
    sanitized.preferredContactMethod = cleanup(fields.preferredContactMethod);
  }
  if (validText(fields.serviceInterest)) {
    sanitized.serviceInterest = cleanup(fields.serviceInterest);
  }
  if (validText(fields.budget)) sanitized.budget = cleanup(fields.budget);
  if (validText(fields.location)) sanitized.location = cleanup(fields.location);
  if (validText(fields.urgency)) sanitized.urgency = cleanup(fields.urgency);
  if (typeof fields.bookingIntent === "boolean") {
    sanitized.bookingIntent = fields.bookingIntent;
  }
  if (validText(fields.freeformNotes, 600)) {
    sanitized.freeformNotes = cleanup(fields.freeformNotes, 600);
  }

  return sanitized;
}

export function mergeExtractedFieldsForGaps(input: {
  deterministic: ExtractedLeadFields;
  llm: ExtractedLeadFields;
  missingFields: LeadFieldKey[];
}) {
  const merged = { ...input.deterministic };
  const llm = sanitizeExtractedFields(input.llm);

  assignIfMissing(merged, "name", llm.name);
  assignIfMissing(merged, "phone", llm.phone);
  assignIfMissing(merged, "email", llm.email);
  assignIfMissing(merged, "preferredContactMethod", llm.preferredContactMethod);
  assignIfMissing(merged, "serviceInterest", llm.serviceInterest);
  assignIfMissing(merged, "budget", llm.budget);
  assignIfMissing(merged, "location", llm.location);
  assignIfMissing(merged, "urgency", llm.urgency);
  assignIfMissing(merged, "freeformNotes", llm.freeformNotes);
  if (merged.bookingIntent !== true && llm.bookingIntent === true) {
    merged.bookingIntent = true;
  }

  return merged;
}

export function hasLeadField(lead: LeadSnapshot, field: LeadFieldKey) {
  if (field === "contact_method") {
    return Boolean(lead.email || lead.phone || lead.preferredContactMethod);
  }
  if (field === "preferred_contact_method") {
    return Boolean(lead.preferredContactMethod);
  }
  if (field === "service_interest") return Boolean(lead.serviceInterest);
  if (field === "booking_intent") return lead.bookingIntent === true;
  if (field === "freeform_notes") return Boolean(lead.freeformNotes);
  return Boolean(lead[field]);
}

function assignIfMissing<K extends keyof ExtractedLeadFields>(
  target: ExtractedLeadFields,
  key: K,
  value: ExtractedLeadFields[K],
) {
  if (target[key] === undefined && value !== undefined) target[key] = value;
}

function validText(value: unknown, maxLength = maxFieldLength): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function validEmail(value: unknown): value is string {
  return validText(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validPhone(value: unknown): value is string {
  return validText(value) && value.replace(/[^\d+]/g, "").length >= 8;
}

function cleanup(value: string, maxLength = maxFieldLength) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function hasUnsupportedPromise(value: string) {
  return /\b(guarantee|guaranteed|promise|definitely|100%|approved|we will fix|legal advice)\b/i.test(
    value,
  );
}

function handoffAware(value: string) {
  return /\b(route|human|team|person|operator|προωθήσω|ομάδα|άνθρωπο|εκπρόσωπο)\b/i.test(
    value,
  );
}

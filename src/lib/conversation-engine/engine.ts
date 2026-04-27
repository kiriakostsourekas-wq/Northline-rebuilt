import { extractLeadFields } from "@/lib/conversation-engine/extraction";
import { detectIntent } from "@/lib/conversation-engine/intents";
import { resolveReplyLocale } from "@/lib/conversation-engine/language";
import type {
  ConversationEngineDecision,
  ConversationEngineInput,
  ConversationEngineOverride,
  ConversationIntent,
  EngineLocale,
  ExtractedLeadFields,
  LeadFieldKey,
  LeadSnapshot,
  PlaybookQuestion,
} from "@/lib/conversation-engine/types";
import type { BusinessContextBundle } from "@/lib/knowledge/types";

export function runConversationEngine(
  input: ConversationEngineInput,
  override: ConversationEngineOverride = {},
): ConversationEngineDecision {
  const replyLocale =
    override.replyLocale ??
    resolveReplyLocale({
      message: input.latestMessage,
      defaultLocale: input.workspace.defaultLocale,
      languageMode: input.workspace.languageMode,
    });
  const intentResult = override.intentResult ?? detectIntent(input.latestMessage);
  const extractedFields =
    override.extractedFields ??
    extractLeadFields({
      message: input.latestMessage,
      contact: {
        name: input.lead.name,
        email: input.lead.email,
        phone: input.lead.phone,
      },
      businessContext: input.businessContext,
    });
  const mergedLead = mergeLead(input.lead, extractedFields);
  const contextGap = findContextGap(intentResult.intent, input.businessContext);
  const missingFields = collectMissingFields({
    intent: intentResult.intent,
    lead: mergedLead,
    playbookFields: input.playbook.requiredFields,
    hasContextGap: Boolean(contextGap),
  });
  const askedFields = chooseAskedFields({
    intent: intentResult.intent,
    locale: replyLocale,
    missingFields,
    questions: input.playbook.questions,
    maxQuestions: input.playbook.maxFollowUpQuestions,
  });
  const shouldFallback =
    intentResult.confidence < input.playbook.confidenceThreshold ||
    intentResult.intent === "UNKNOWN";
  const escalationReason = resolveEscalationReason({
    intent: intentResult.intent,
    shouldFallback,
    contextGap,
  });
  const shouldEscalate = Boolean(escalationReason);
  const score = scoreLead(mergedLead, intentResult.intent, missingFields);
  const leadStatus = resolveLeadStatus({
    score,
    shouldEscalate,
    missingFields,
    bookingIntent: mergedLead.bookingIntent === true,
  });
  const nextConversationStatus = shouldEscalate
    ? "WAITING_ON_BUSINESS"
    : "WAITING_ON_LEAD";
  const reply =
    override.reply ??
    buildReply({
      locale: replyLocale,
      intent: intentResult.intent,
      shouldFallback,
      shouldEscalate,
      escalationReason: escalationReason ?? undefined,
      contextGap,
      askedFields,
      questions: input.playbook.questions,
      businessContext: input.businessContext,
      lead: mergedLead,
    });
  const confidence = clamp(
    (intentResult.confidence + fieldConfidence(mergedLead, missingFields)) / 2,
    0,
    1,
  );
  const stage = shouldEscalate
    ? "ESCALATED"
    : shouldFallback
      ? "FALLBACK"
      : mergedLead.bookingIntent && missingFields.length === 0
        ? "BOOKING_READY"
        : missingFields.length === 0
          ? "QUALIFIED"
          : "COLLECTING_DETAILS";

  return {
    intent: intentResult.intent,
    intentConfidence: round(intentResult.confidence),
    replyLocale,
    extractedFields,
    mergedLead,
    missingFields,
    askedFields,
    reply,
    nextConversationStatus,
    leadStatus,
    score,
    confidence: round(confidence),
    shouldEscalate,
    escalationReason: escalationReason ?? undefined,
    summary:
      override.summary ??
      buildSummary({
        intent: intentResult.intent,
        lead: mergedLead,
        missingFields,
        shouldEscalate,
      }),
    internalNotes:
      override.internalNotes ??
      buildInternalNotes({
        intent: intentResult.intent,
        confidence,
        lead: mergedLead,
        missingFields,
        escalationReason: escalationReason ?? undefined,
      }),
    ai: override.ai,
    state: {
      stage,
      lastIntent: intentResult.intent,
      missingFields,
      replyLocale,
      confidence: round(confidence),
    },
  };
}

function mergeLead(
  lead: LeadSnapshot,
  extracted: ExtractedLeadFields,
): LeadSnapshot {
  return {
    ...lead,
    name: extracted.name ?? lead.name,
    email: extracted.email ?? lead.email,
    phone: extracted.phone ?? lead.phone,
    preferredContactMethod:
      extracted.preferredContactMethod ?? lead.preferredContactMethod,
    serviceInterest: extracted.serviceInterest ?? lead.serviceInterest,
    budget: extracted.budget ?? lead.budget,
    location: extracted.location ?? lead.location,
    urgency: extracted.urgency ?? lead.urgency,
    bookingIntent: extracted.bookingIntent ?? lead.bookingIntent,
    freeformNotes: extracted.freeformNotes ?? lead.freeformNotes,
  };
}

function collectMissingFields(input: {
  intent: ConversationIntent;
  lead: LeadSnapshot;
  playbookFields: LeadFieldKey[];
  hasContextGap: boolean;
}) {
  const fields = new Set<LeadFieldKey>(input.playbookFields);

  if (input.intent === "SERVICE_AVAILABILITY") fields.add("location");
  if (input.intent === "PRICING_QUESTION" && input.hasContextGap) {
    fields.add("budget");
  }
  if (input.intent === "HUMAN_HANDOFF") fields.add("contact_method");

  return Array.from(fields).filter((field) => !hasField(input.lead, field));
}

function hasField(lead: LeadSnapshot, field: LeadFieldKey) {
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

function chooseAskedFields(input: {
  intent: ConversationIntent;
  locale: EngineLocale;
  missingFields: LeadFieldKey[];
  questions: PlaybookQuestion[];
  maxQuestions: number;
}) {
  const priority = intentFieldPriority[input.intent] ?? [];
  const sorted = [...input.missingFields].sort((a, b) => {
    const priorityA = priority.indexOf(a);
    const priorityB = priority.indexOf(b);
    if (priorityA !== -1 || priorityB !== -1) {
      return (priorityA === -1 ? 999 : priorityA) - (priorityB === -1 ? 999 : priorityB);
    }
    return questionPriority(input.questions, a) - questionPriority(input.questions, b);
  });

  return sorted.slice(0, input.maxQuestions);
}

function findContextGap(
  intent: ConversationIntent,
  bundle: BusinessContextBundle,
) {
  if (intent === "PRICING_QUESTION" && !hasEntries(bundle, "PRICING")) {
    return "Pricing question without published pricing notes.";
  }
  if (intent === "BOOKING_REQUEST" && !hasEntries(bundle, "BOOKING_RULES")) {
    return "Booking request without published booking rules.";
  }
  if (
    intent === "SERVICE_AVAILABILITY" &&
    !hasEntries(bundle, "SERVICES") &&
    !hasEntries(bundle, "LOCATIONS")
  ) {
    return "Availability question without published services or locations.";
  }
  return null;
}

function resolveEscalationReason(input: {
  intent: ConversationIntent;
  shouldFallback: boolean;
  contextGap: string | null;
}) {
  if (input.intent === "HUMAN_HANDOFF") {
    return "Lead requested support or human handoff.";
  }
  if (input.contextGap) return input.contextGap;
  return null;
}

function buildReply(input: {
  locale: EngineLocale;
  intent: ConversationIntent;
  shouldFallback: boolean;
  shouldEscalate: boolean;
  escalationReason?: string;
  contextGap: string | null;
  askedFields: LeadFieldKey[];
  questions: PlaybookQuestion[];
  businessContext: BusinessContextBundle;
  lead: LeadSnapshot;
}) {
  const questions = input.askedFields
    .map((field) => questionForField(input.questions, field)?.prompt[input.locale])
    .filter(Boolean);
  const contextSnippet = contextSnippetForIntent(
    input.intent,
    input.businessContext,
  );
  const followUp = questions.length > 0 ? ` ${questions.join(" ")}` : "";

  if (input.locale === "EL") {
    if (input.intent === "HUMAN_HANDOFF") {
      return `Θα το προωθήσω στην ομάδα για ανθρώπινη συνέχεια.${followUp}`;
    }
    if (input.contextGap) {
      return `Δεν θέλω να μαντέψω πολιτικές ή λεπτομέρειες που δεν έχουν εγκριθεί. Θα κρατήσω τα σωστά στοιχεία για την ομάδα.${followUp}`;
    }
    if (input.shouldFallback) {
      return `Μπορώ να βοηθήσω, αλλά χρειάζομαι λίγες ακόμη πληροφορίες για να σας κατευθύνω σωστά.${followUp}`;
    }
    if (contextSnippet) {
      return `Σύμφωνα με τα εγκεκριμένα στοιχεία: ${contextSnippet}${followUp}`;
    }
    if (input.lead.bookingIntent && questions.length === 0) {
      return "Ευχαριστώ, έχω τα βασικά στοιχεία. Θα το περάσω στην ομάδα για το επόμενο βήμα.";
    }
    return `Ευχαριστώ, μπορώ να βοηθήσω με το αίτημά σας.${followUp}`;
  }

  if (input.intent === "HUMAN_HANDOFF") {
    return `I’ll route this to the team so a person can follow up.${followUp}`;
  }
  if (input.contextGap) {
    return `I do not want to guess at policies or details that are not approved yet. I’ll collect the right context for the team.${followUp}`;
  }
  if (input.shouldFallback) {
    return `I can help, but I need a little more context to route this correctly.${followUp}`;
  }
  if (contextSnippet) {
    return `Based on the approved business information: ${contextSnippet}${followUp}`;
  }
  if (input.lead.bookingIntent && questions.length === 0) {
    return "Thanks, I have the key details. I’ll pass this to the team for the next step.";
  }
  return `Thanks, I can help with that.${followUp}`;
}

function contextSnippetForIntent(
  intent: ConversationIntent,
  bundle: BusinessContextBundle,
) {
  const section =
    intent === "PRICING_QUESTION"
      ? "PRICING"
      : intent === "SERVICE_AVAILABILITY"
        ? "SERVICES"
        : intent === "BOOKING_REQUEST"
          ? "BOOKING_RULES"
          : null;
  if (!section) return null;
  const entry = bundle.sections.find((item) => item.section === section)
    ?.entries[0];
  if (!entry?.text) return null;
  return truncate(entry.text.replace(/\n/g, " "), 240);
}

function scoreLead(
  lead: LeadSnapshot,
  intent: ConversationIntent,
  missingFields: LeadFieldKey[],
) {
  let score = 0;
  if (lead.name) score += 10;
  if (lead.email || lead.phone) score += 20;
  if (lead.serviceInterest) score += 20;
  if (lead.location) score += 10;
  if (lead.budget) score += 8;
  if (lead.urgency) score += urgencyScore(lead.urgency);
  if (lead.bookingIntent || intent === "BOOKING_REQUEST") score += 15;
  if (intent === "PRICING_QUESTION" || intent === "SERVICE_AVAILABILITY") {
    score += 8;
  }

  return clamp(Math.round(score - missingFields.length * 4), 0, 100);
}

function urgencyScore(value: string) {
  const normalized = value.toLowerCase();
  if (/immediate|today|tomorrow|άμεσα|σήμερα|αύριο/.test(normalized)) return 18;
  if (/week|εβδομάδα/.test(normalized)) return 14;
  if (/month|μήνα/.test(normalized)) return 8;
  return 4;
}

function resolveLeadStatus(input: {
  score: number;
  shouldEscalate: boolean;
  missingFields: LeadFieldKey[];
  bookingIntent: boolean;
}): ConversationEngineDecision["leadStatus"] {
  if (input.shouldEscalate) return "HANDED_OFF";
  if (input.score >= 82 && input.missingFields.length === 0) return "SALES_READY";
  if (input.score >= 62 && !input.missingFields.includes("contact_method")) {
    return input.bookingIntent ? "SALES_READY" : "QUALIFIED";
  }
  if (input.score >= 35) return "QUALIFYING";
  return "NURTURE";
}

function buildSummary(input: {
  intent: ConversationIntent;
  lead: LeadSnapshot;
  missingFields: LeadFieldKey[];
  shouldEscalate: boolean;
}) {
  const known = [
    input.lead.name ? `name ${input.lead.name}` : null,
    input.lead.email ? `email ${input.lead.email}` : null,
    input.lead.phone ? `phone ${input.lead.phone}` : null,
    input.lead.serviceInterest ? `interest ${input.lead.serviceInterest}` : null,
    input.lead.location ? `location ${input.lead.location}` : null,
    input.lead.urgency ? `timeline ${input.lead.urgency}` : null,
  ].filter(Boolean);
  const missing = input.missingFields.length
    ? ` Missing: ${input.missingFields.map(labelForField).join(", ")}.`
    : " No required fields are missing.";
  const handoff = input.shouldEscalate ? " Handoff recommended." : "";

  return `${formatIntent(input.intent)}. ${known.length ? `Known: ${known.join("; ")}.` : "Known details are limited."}${missing}${handoff}`;
}

function buildInternalNotes(input: {
  intent: ConversationIntent;
  confidence: number;
  lead: LeadSnapshot;
  missingFields: LeadFieldKey[];
  escalationReason?: string;
}) {
  const lines = [
    `Intent: ${formatIntent(input.intent)}`,
    `Confidence: ${round(input.confidence)}`,
    `Missing fields: ${
      input.missingFields.length
        ? input.missingFields.map(labelForField).join(", ")
        : "none"
    }`,
    input.escalationReason ? `Escalation: ${input.escalationReason}` : null,
    "CRM export notes:",
    `- Name: ${input.lead.name ?? "unknown"}`,
    `- Email: ${input.lead.email ?? "unknown"}`,
    `- Phone: ${input.lead.phone ?? "unknown"}`,
    `- Interest: ${input.lead.serviceInterest ?? "unknown"}`,
    `- Budget: ${input.lead.budget ?? "unknown"}`,
    `- Location: ${input.lead.location ?? "unknown"}`,
    `- Timeline: ${input.lead.urgency ?? "unknown"}`,
    `- Preferred contact: ${input.lead.preferredContactMethod ?? "unknown"}`,
    `- Notes: ${input.lead.freeformNotes ?? "none"}`,
  ].filter(Boolean);

  return lines.join("\n");
}

function questionForField(questions: PlaybookQuestion[], field: LeadFieldKey) {
  return questions.find((question) => question.field === field);
}

function questionPriority(questions: PlaybookQuestion[], field: LeadFieldKey) {
  return questionForField(questions, field)?.priority ?? 999;
}

function hasEntries(bundle: BusinessContextBundle, section: string) {
  return Boolean(
    bundle.sections.find((item) => item.section === section)?.entries.length,
  );
}

function fieldConfidence(lead: LeadSnapshot, missingFields: LeadFieldKey[]) {
  const requiredCount = 4;
  const missingRequired = missingFields.filter((field) =>
    ["name", "contact_method", "service_interest", "urgency"].includes(field),
  ).length;
  const base = (requiredCount - missingRequired) / requiredCount;
  return clamp(base + (lead.bookingIntent ? 0.08 : 0), 0, 1);
}

function formatIntent(intent: ConversationIntent) {
  return intent.replaceAll("_", " ").toLowerCase();
}

function labelForField(field: LeadFieldKey) {
  return field.replaceAll("_", " ");
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

const intentFieldPriority: Record<ConversationIntent, LeadFieldKey[]> = {
  NEW_LEAD_INQUIRY: ["service_interest", "contact_method", "urgency", "name"],
  PRICING_QUESTION: ["service_interest", "budget", "contact_method", "urgency"],
  BOOKING_REQUEST: ["contact_method", "service_interest", "urgency", "name"],
  SERVICE_AVAILABILITY: ["service_interest", "location", "contact_method"],
  HUMAN_HANDOFF: ["contact_method", "name", "service_interest"],
  UNKNOWN: ["service_interest", "contact_method", "name"],
};

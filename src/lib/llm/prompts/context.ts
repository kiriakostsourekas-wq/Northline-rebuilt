import type {
  ConversationEngineDecision,
  ConversationEngineInput,
  EngineLocale,
} from "@/lib/conversation-engine/types";
import type { LlmContextPacket } from "@/lib/llm/types";

const maxRecentMessages = 8;
const maxContextEntries = 10;
const maxEntryLength = 700;

export function buildLlmContextPacket(input: {
  conversation: ConversationEngineInput;
  decision?: ConversationEngineDecision;
}): LlmContextPacket {
  const conversation = input.conversation;
  const decision = input.decision;
  const preferredLocale =
    decision?.replyLocale ?? conversation.lead.preferredLocale ?? conversation.workspace.defaultLocale;

  return {
    workspace: {
      name: conversation.workspace.name,
      defaultLocale: conversation.workspace.defaultLocale,
      languageMode: conversation.workspace.languageMode,
      primaryMarket: conversation.businessContext.workspace.primaryMarket,
    },
    languagePolicy: {
      allowedLocales: allowedLocales(conversation.workspace.languageMode),
      preferredLocale,
      instruction: languageInstruction(conversation.workspace.languageMode),
    },
    conversationState: {
      latestMessage: conversation.latestMessage,
      recentMessages: conversation.messages.slice(-maxRecentMessages).map((message) => ({
        direction: message.direction,
        senderType: message.senderType,
        body: truncate(message.body, 900),
      })),
      intent: decision?.intent,
      stage: decision?.state.stage,
      missingFields: decision?.missingFields ?? [],
      askedFields: decision?.askedFields ?? [],
      shouldEscalate: decision?.shouldEscalate ?? false,
      escalationReason: decision?.escalationReason,
    },
    lead: {
      name: conversation.lead.name,
      email: conversation.lead.email,
      phone: conversation.lead.phone,
      preferredContactMethod: conversation.lead.preferredContactMethod,
      serviceInterest: conversation.lead.serviceInterest,
      budget: conversation.lead.budget,
      location: conversation.lead.location,
      urgency: conversation.lead.urgency,
      bookingIntent: conversation.lead.bookingIntent,
      freeformNotes: truncate(conversation.lead.freeformNotes ?? "", 600) || undefined,
      preferredLocale: conversation.lead.preferredLocale,
      status: conversation.lead.status,
      score: conversation.lead.score,
      summary: truncate(conversation.lead.summary ?? "", 700) || undefined,
    },
    businessRules: {
      playbookName: conversation.playbook.name,
      playbookVersion: conversation.playbook.version,
      requiredFields: conversation.playbook.requiredFields,
      maxFollowUpQuestions: conversation.playbook.maxFollowUpQuestions,
      safeguards: [
        "Do not invent pricing, discounts, timelines, availability, policies, legal terms, or guarantees.",
        "Use only approved business context for business-specific claims.",
        "Ask concise follow-up questions for missing qualification fields.",
        "Route to a human when the customer asks for a person or approved context is missing.",
        "Keep Greek and English as first-class languages; Greeklish should usually receive Greek replies.",
      ],
    },
    retrievalResults: conversation.businessContext.sections
      .flatMap((section) =>
        section.entries.map((entry) => ({
          id: entry.id,
          section: section.section,
          title: entry.title,
          locale: entry.locale,
          text: truncate(entry.text, maxEntryLength),
        })),
      )
      .slice(0, maxContextEntries),
    allowedActions: allowedActions(decision),
    warnings: conversation.businessContext.warnings,
  };
}

export function stringifyContextPacket(packet: LlmContextPacket) {
  return JSON.stringify(packet, null, 2);
}

function allowedLocales(languageMode: string): EngineLocale[] {
  if (languageMode === "GREEK") return ["EL"];
  if (languageMode === "ENGLISH") return ["EN"];
  return ["EN", "EL"];
}

function languageInstruction(languageMode: string) {
  if (languageMode === "GREEK") return "Reply in Greek.";
  if (languageMode === "ENGLISH") return "Reply in English.";
  return "Reply in the lead's language. If the language is mixed or Greeklish, prefer Greek when Greek intent is clear.";
}

function allowedActions(decision?: ConversationEngineDecision) {
  const actions = ["classify_intent", "extract_lead_fields", "ask_follow_up"];
  if (!decision?.shouldEscalate) actions.push("generate_reply");
  if (decision?.state.stage === "BOOKING_READY") actions.push("suggest_booking");
  actions.push("route_to_human_when_required");
  return actions;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

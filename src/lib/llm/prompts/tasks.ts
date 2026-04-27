import type { ConversationEngineDecision } from "@/lib/conversation-engine/types";
import { buildLlmContextPacket, stringifyContextPacket } from "@/lib/llm/prompts/context";
import type { LlmPromptPacket, LlmTaskInput } from "@/lib/llm/types";

const promptVersions = {
  intent: "intent.v1",
  language: "language.v1",
  extraction: "extraction.v1",
  reply: "reply.v1",
  summary: "summary.v1",
  handoff: "handoff.v1",
} as const;

export function buildIntentPrompt(input: LlmTaskInput): LlmPromptPacket {
  const packet = stringifyContextPacket(buildLlmContextPacket(input));
  return {
    id: "northline.intent_classifier",
    version: promptVersions.intent,
    task: "intent_classification",
    responseFormat: "json",
    modelClass: "fast",
    temperature: 0,
    maxOutputTokens: 220,
    messages: [
      {
        role: "system",
        content:
          "Classify one inbound lead message for Northline. Return only JSON. Valid intents are NEW_LEAD_INQUIRY, PRICING_QUESTION, BOOKING_REQUEST, SERVICE_AVAILABILITY, HUMAN_HANDOFF, UNKNOWN. Use HUMAN_HANDOFF only when the lead asks for a person or support. Do not answer the lead.",
      },
      {
        role: "user",
        content: `${packet}\n\nReturn JSON with shape {"intent":"...","confidence":0.0}.`,
      },
    ],
  };
}

export function buildLanguagePrompt(input: LlmTaskInput): LlmPromptPacket {
  const packet = stringifyContextPacket(buildLlmContextPacket(input));
  return {
    id: "northline.language_detector",
    version: promptVersions.language,
    task: "language_detection",
    responseFormat: "json",
    modelClass: "fast",
    temperature: 0,
    maxOutputTokens: 220,
    messages: [
      {
        role: "system",
        content:
          "Detect the best response language for an inbound lead. Return only JSON. Use EL for Greek or Greeklish when Greek intent is clear. Set needsConfirmation true only when language choice is genuinely ambiguous.",
      },
      {
        role: "user",
        content:
          `${packet}\n\nReturn JSON with shape ` +
          `{"locale":"EN|EL","confidence":0.0,"needsConfirmation":false}.`,
      },
    ],
  };
}

export function buildFieldExtractionPrompt(input: LlmTaskInput): LlmPromptPacket {
  const packet = stringifyContextPacket(buildLlmContextPacket(input));
  return {
    id: "northline.lead_field_extractor",
    version: promptVersions.extraction,
    task: "field_extraction",
    responseFormat: "json",
    modelClass: "fast",
    temperature: 0,
    maxOutputTokens: 420,
    messages: [
      {
        role: "system",
        content:
          "Extract only lead qualification fields explicitly present in the latest message or stable conversation context. Return only JSON. Do not infer missing values. Preserve the customer's language for service, location, urgency, and notes when useful.",
      },
      {
        role: "user",
        content:
          `${packet}\n\nReturn JSON with shape ` +
          `{"fields":{"name":"","phone":"","email":"","preferredContactMethod":"","serviceInterest":"","budget":"","location":"","urgency":"","bookingIntent":false,"freeformNotes":""},"confidence":0.0}. Omit unknown fields.`,
      },
    ],
  };
}

export function buildReplyPrompt(input: {
  conversation: LlmTaskInput["conversation"];
  decision: ConversationEngineDecision;
}): LlmPromptPacket {
  const packet = stringifyContextPacket(buildLlmContextPacket(input));
  return {
    id: "northline.reply_generator",
    version: promptVersions.reply,
    task: "reply_generation",
    responseFormat: "json",
    modelClass: "generation",
    temperature: 0.2,
    maxOutputTokens: 320,
    messages: [
      {
        role: "system",
        content:
          "Write a concise customer-facing reply for a controlled inbound lead workflow. Return only JSON. The workflow state controls what can happen; do not add new actions. Do not invent pricing, availability, policies, timelines, discounts, or guarantees. Ask no more than the listed follow-up fields. If handoff is required, say it will be routed to the team.",
      },
      {
        role: "user",
        content:
          `${packet}\n\nDecision: ${JSON.stringify(safeDecision(input.decision), null, 2)}` +
          `\n\nReturn JSON with shape {"reply":"...","confidence":0.0}.`,
      },
    ],
  };
}

export function buildConversationSummaryPrompt(input: {
  conversation: LlmTaskInput["conversation"];
  decision: ConversationEngineDecision;
}): LlmPromptPacket {
  const packet = stringifyContextPacket(buildLlmContextPacket(input));
  return {
    id: "northline.conversation_summary",
    version: promptVersions.summary,
    task: "conversation_summary",
    responseFormat: "json",
    modelClass: "fast",
    temperature: 0,
    maxOutputTokens: 320,
    messages: [
      {
        role: "system",
        content:
          "Summarize the conversation for CRM and lead operations. Return only JSON. Keep it factual, compact, and based only on the conversation and structured decision.",
      },
      {
        role: "user",
        content:
          `${packet}\n\nDecision: ${JSON.stringify(safeDecision(input.decision), null, 2)}` +
          `\n\nReturn JSON with shape {"summary":"...","confidence":0.0}.`,
      },
    ],
  };
}

export function buildHandoffSummaryPrompt(input: {
  conversation: LlmTaskInput["conversation"];
  decision: ConversationEngineDecision;
  reason?: string;
}): LlmPromptPacket {
  const packet = stringifyContextPacket(buildLlmContextPacket(input));
  return {
    id: "northline.handoff_summary",
    version: promptVersions.handoff,
    task: "handoff_summary",
    responseFormat: "json",
    modelClass: "fast",
    temperature: 0,
    maxOutputTokens: 380,
    messages: [
      {
        role: "system",
        content:
          "Summarize a lead handoff for a human operator. Return only JSON. Include known details, missing details, why handoff is needed, and the next safe operator action. Do not create promises or policy statements.",
      },
      {
        role: "user",
        content:
          `${packet}\n\nReason: ${input.reason ?? input.decision.escalationReason ?? "Human review requested."}` +
          `\nDecision: ${JSON.stringify(safeDecision(input.decision), null, 2)}` +
          `\n\nReturn JSON with shape {"summary":"...","recommendedNextStep":"...","confidence":0.0}.`,
      },
    ],
  };
}

function safeDecision(decision: ConversationEngineDecision) {
  return {
    intent: decision.intent,
    intentConfidence: decision.intentConfidence,
    replyLocale: decision.replyLocale,
    missingFields: decision.missingFields,
    askedFields: decision.askedFields,
    shouldEscalate: decision.shouldEscalate,
    escalationReason: decision.escalationReason,
    leadStatus: decision.leadStatus,
    score: decision.score,
    confidence: decision.confidence,
    state: decision.state,
    mergedLead: decision.mergedLead,
  };
}

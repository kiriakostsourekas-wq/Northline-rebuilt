import type {
  ConversationEngineDecision,
  ConversationIntent,
  ExtractedLeadFields,
} from "@/lib/conversation-engine/types";
import {
  buildConversationSummaryPrompt,
  buildFieldExtractionPrompt,
  buildHandoffSummaryPrompt,
  buildIntentPrompt,
  buildLanguagePrompt,
  buildReplyPrompt,
} from "@/lib/llm/prompts/tasks";
import { createLlmProviderFromEnv } from "@/lib/llm/provider";
import { sanitizeExtractedFields, validateGeneratedReply } from "@/lib/llm/safety";
import { llmErrorMessage, recordLlmTrace } from "@/lib/llm/tracing";
import type {
  LlmConversationSummary,
  LlmFieldExtraction,
  LlmHandoffSummary,
  LlmIntentClassification,
  LlmLanguageDetection,
  LlmPromptPacket,
  LlmProvider,
  LlmProviderRequest,
  LlmReplyGeneration,
  LlmTaskInput,
  LlmTaskResult,
  LlmTaskTrace,
} from "@/lib/llm/types";

const intents = new Set<ConversationIntent>([
  "NEW_LEAD_INQUIRY",
  "PRICING_QUESTION",
  "BOOKING_REQUEST",
  "SERVICE_AVAILABILITY",
  "HUMAN_HANDOFF",
  "UNKNOWN",
]);

export class NorthlineLlmOrchestrator {
  constructor(
    private readonly provider: LlmProvider = createLlmProviderFromEnv(),
    private readonly timeoutMs = parseTimeout(),
  ) {}

  classifyIntent(input: LlmTaskInput) {
    return this.invokeJson(buildIntentPrompt(input), parseIntentClassification);
  }

  detectLanguageOrConfirm(input: LlmTaskInput) {
    return this.invokeJson(buildLanguagePrompt(input), parseLanguageDetection);
  }

  extractLeadFields(input: LlmTaskInput) {
    return this.invokeJson(buildFieldExtractionPrompt(input), parseFieldExtraction);
  }

  generateReply(input: {
    conversation: LlmTaskInput["conversation"];
    decision: ConversationEngineDecision;
  }) {
    return this.invokeJson(buildReplyPrompt(input), (value) =>
      parseReplyGeneration(value, input.decision),
    );
  }

  summarizeConversation(input: {
    conversation: LlmTaskInput["conversation"];
    decision: ConversationEngineDecision;
  }) {
    return this.invokeJson(
      buildConversationSummaryPrompt(input),
      parseConversationSummary,
    );
  }

  summarizeForHandoff(input: {
    conversation: LlmTaskInput["conversation"];
    decision: ConversationEngineDecision;
    reason?: string;
  }) {
    return this.invokeJson(buildHandoffSummaryPrompt(input), parseHandoffSummary);
  }

  private async invokeJson<T>(
    prompt: LlmPromptPacket,
    parse: (value: unknown) => T,
  ): Promise<LlmTaskResult<T>> {
    if (!this.provider.isEnabled) {
      const trace = this.trace(prompt, 0, false, "provider disabled");
      recordLlmTrace(trace);
      return { ok: false, fallbackReason: "provider disabled", trace };
    }

    const startedAt = Date.now();
    try {
      const response = await this.provider.invoke(this.request(prompt));
      const value = parse(parseJson(response.content));
      const trace = this.trace(prompt, Date.now() - startedAt, true, undefined, {
        model: response.model,
        usage: response.usage,
      });
      recordLlmTrace(trace);
      return { ok: true, value, trace };
    } catch (error) {
      const trace = this.trace(
        prompt,
        Date.now() - startedAt,
        false,
        llmErrorMessage(error),
      );
      recordLlmTrace(trace);
      return { ok: false, fallbackReason: trace.error ?? "LLM task failed", trace };
    }
  }

  private request(prompt: LlmPromptPacket): LlmProviderRequest {
    return {
      ...prompt,
      timeoutMs: this.timeoutMs,
    };
  }

  private trace(
    prompt: LlmPromptPacket,
    latencyMs: number,
    success: boolean,
    error?: string,
    options: Pick<LlmTaskTrace, "model" | "usage"> = {},
  ): LlmTaskTrace {
    return {
      task: prompt.task,
      provider: this.provider.name,
      promptId: prompt.id,
      promptVersion: prompt.version,
      latencyMs,
      success,
      error,
      ...options,
    };
  }
}

export function createNorthlineLlmOrchestrator(provider?: LlmProvider) {
  return new NorthlineLlmOrchestrator(provider);
}

export function classifyIntent(input: LlmTaskInput, provider?: LlmProvider) {
  return createNorthlineLlmOrchestrator(provider).classifyIntent(input);
}

export function detectLanguageOrConfirm(
  input: LlmTaskInput,
  provider?: LlmProvider,
) {
  return createNorthlineLlmOrchestrator(provider).detectLanguageOrConfirm(input);
}

export function extractLeadFields(input: LlmTaskInput, provider?: LlmProvider) {
  return createNorthlineLlmOrchestrator(provider).extractLeadFields(input);
}

export function generateReply(
  input: {
    conversation: LlmTaskInput["conversation"];
    decision: ConversationEngineDecision;
  },
  provider?: LlmProvider,
) {
  return createNorthlineLlmOrchestrator(provider).generateReply(input);
}

export function summarizeConversation(
  input: {
    conversation: LlmTaskInput["conversation"];
    decision: ConversationEngineDecision;
  },
  provider?: LlmProvider,
) {
  return createNorthlineLlmOrchestrator(provider).summarizeConversation(input);
}

export function summarizeForHandoff(
  input: {
    conversation: LlmTaskInput["conversation"];
    decision: ConversationEngineDecision;
    reason?: string;
  },
  provider?: LlmProvider,
) {
  return createNorthlineLlmOrchestrator(provider).summarizeForHandoff(input);
}

function parseIntentClassification(value: unknown): LlmIntentClassification {
  const record = objectValue(value);
  const intent = record.intent;
  if (!intents.has(intent as ConversationIntent)) {
    throw new Error("LLM intent response used an invalid intent.");
  }

  return {
    intent: intent as ConversationIntent,
    confidence: confidence(record.confidence),
  };
}

function parseLanguageDetection(value: unknown): LlmLanguageDetection {
  const record = objectValue(value);
  const locale = record.locale;
  if (locale !== "EN" && locale !== "EL") {
    throw new Error("LLM language response used an invalid locale.");
  }

  return {
    locale,
    confidence: confidence(record.confidence),
    needsConfirmation: record.needsConfirmation === true,
  };
}

function parseFieldExtraction(value: unknown): LlmFieldExtraction {
  const record = objectValue(value);
  return {
    fields: sanitizeExtractedFields(toExtractedFields(record.fields)),
    confidence: confidence(record.confidence),
  };
}

function parseReplyGeneration(
  value: unknown,
  decision: ConversationEngineDecision,
): LlmReplyGeneration {
  const record = objectValue(value);
  const reply = typeof record.reply === "string" ? record.reply : "";
  const safe = validateGeneratedReply({
    reply,
    locale: decision.replyLocale,
    decision,
  });
  if (!safe.ok) throw new Error(`Unsafe generated reply: ${safe.reason}.`);
  return {
    reply: safe.value,
    confidence: confidence(record.confidence),
  };
}

function parseConversationSummary(value: unknown): LlmConversationSummary {
  const record = objectValue(value);
  const summary = textValue(record.summary, 900);
  if (!summary) throw new Error("LLM summary response was empty.");
  return {
    summary,
    confidence: confidence(record.confidence),
  };
}

function parseHandoffSummary(value: unknown): LlmHandoffSummary {
  const record = objectValue(value);
  const summary = textValue(record.summary, 900);
  const recommendedNextStep = textValue(record.recommendedNextStep, 300);
  if (!summary || !recommendedNextStep) {
    throw new Error("LLM handoff summary response was incomplete.");
  }
  return {
    summary,
    recommendedNextStep,
    confidence: confidence(record.confidence),
  };
}

function parseJson(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(content.slice(start, end + 1));
    }
    throw new Error("LLM response was not valid JSON.");
  }
}

function toExtractedFields(value: unknown): ExtractedLeadFields {
  const fields = objectValue(value);
  return {
    name: stringField(fields.name),
    phone: stringField(fields.phone),
    email: stringField(fields.email),
    preferredContactMethod: stringField(fields.preferredContactMethod),
    serviceInterest: stringField(fields.serviceInterest),
    budget: stringField(fields.budget),
    location: stringField(fields.location),
    urgency: stringField(fields.urgency),
    bookingIntent:
      typeof fields.bookingIntent === "boolean" ? fields.bookingIntent : undefined,
    freeformNotes: stringField(fields.freeformNotes),
  };
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function textValue(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : "";
}

function confidence(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(value, 0), 1)
    : 0;
}

function parseTimeout() {
  const parsed = Number.parseInt(process.env.NORTHLINE_LLM_TIMEOUT_MS ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8_000;
}

import { runConversationEngine } from "@/lib/conversation-engine/engine";
import type {
  ConversationEngineAiMetadata,
  ConversationEngineDecision,
  ConversationEngineInput,
  EngineLocale,
} from "@/lib/conversation-engine/types";
import { createNorthlineLlmOrchestrator } from "@/lib/llm/orchestrator";
import {
  canUseGeneratedReply,
  hasLeadField,
  mergeExtractedFieldsForGaps,
} from "@/lib/llm/safety";
import type {
  LlmIntentClassification,
  LlmLanguageDetection,
  LlmProvider,
  LlmTaskResult,
  LlmTaskTrace,
} from "@/lib/llm/types";

export async function runConversationEngineWithLlm(
  input: ConversationEngineInput,
  options: { provider?: LlmProvider } = {},
): Promise<ConversationEngineDecision> {
  const deterministic = runConversationEngine(input);
  const orchestrator = createNorthlineLlmOrchestrator(options.provider);
  const traces: LlmTaskTrace[] = [];
  const fallbackReasons: string[] = [];

  const intentResult = await maybeClassifyIntent({
    input,
    decision: deterministic,
    orchestrator,
  });
  collectResult(intentResult, traces, fallbackReasons);

  const languageResult = await maybeDetectLanguage({
    input,
    decision: deterministic,
    orchestrator,
  });
  collectResult(languageResult, traces, fallbackReasons);

  const extractionResult = await maybeExtractFields({
    input,
    decision: deterministic,
    orchestrator,
  });
  collectResult(extractionResult, traces, fallbackReasons);

  const extractedFields =
    extractionResult?.ok === true
      ? mergeExtractedFieldsForGaps({
          deterministic: deterministic.extractedFields,
          llm: extractionResult.value.fields,
          missingFields: deterministic.missingFields,
        })
      : undefined;
  const intentOverride = intentOverrideFor(deterministic, intentResult);
  const localeOverride = localeOverrideFor(input, languageResult);
  let enhanced = runConversationEngine(input, {
    extractedFields,
    intentResult: intentOverride,
    replyLocale: localeOverride,
    ai: aiMetadata({
      provider: traces[0]?.provider ?? options.provider?.name ?? "disabled",
      traces,
      usedGeneratedReply: false,
      fallbackReasons,
    }),
  });

  const replyResult =
    canUseGeneratedReply(enhanced)
      ? await orchestrator.generateReply({ conversation: input, decision: enhanced })
      : null;
  collectResult(replyResult, traces, fallbackReasons);

  const summaryResult = await orchestrator.summarizeConversation({
    conversation: input,
    decision: enhanced,
  });
  collectResult(summaryResult, traces, fallbackReasons);

  const handoffResult =
    enhanced.shouldEscalate || enhanced.state.stage === "ESCALATED"
      ? await orchestrator.summarizeForHandoff({
          conversation: input,
          decision: enhanced,
          reason: enhanced.escalationReason,
        })
      : null;
  collectResult(handoffResult, traces, fallbackReasons);

  enhanced = {
    ...enhanced,
    reply: replyResult?.ok === true ? replyResult.value.reply : enhanced.reply,
    summary:
      summaryResult.ok === true ? summaryResult.value.summary : enhanced.summary,
    internalNotes:
      handoffResult?.ok === true
        ? `${enhanced.internalNotes}\n\nLLM handoff summary:\n${handoffResult.value.summary}\nNext step: ${handoffResult.value.recommendedNextStep}`
        : enhanced.internalNotes,
    ai: aiMetadata({
      provider: traces[0]?.provider ?? options.provider?.name ?? "disabled",
      traces,
      usedGeneratedReply: replyResult?.ok === true,
      fallbackReasons,
    }),
  };

  return enhanced;
}

async function maybeClassifyIntent(input: {
  input: ConversationEngineInput;
  decision: ConversationEngineDecision;
  orchestrator: ReturnType<typeof createNorthlineLlmOrchestrator>;
}) {
  if (
    input.decision.intent !== "UNKNOWN" &&
    input.decision.intentConfidence >= input.input.playbook.confidenceThreshold
  ) {
    return null;
  }
  return input.orchestrator.classifyIntent({
    conversation: input.input,
    decision: input.decision,
  });
}

async function maybeDetectLanguage(input: {
  input: ConversationEngineInput;
  decision: ConversationEngineDecision;
  orchestrator: ReturnType<typeof createNorthlineLlmOrchestrator>;
}) {
  if (input.input.workspace.languageMode === "GREEK") return null;
  if (input.input.workspace.languageMode === "ENGLISH") return null;
  return input.orchestrator.detectLanguageOrConfirm({
    conversation: input.input,
    decision: input.decision,
  });
}

async function maybeExtractFields(input: {
  input: ConversationEngineInput;
  decision: ConversationEngineDecision;
  orchestrator: ReturnType<typeof createNorthlineLlmOrchestrator>;
}) {
  const hasGaps = input.decision.missingFields.some(
    (field) => !hasLeadField(input.decision.mergedLead, field),
  );
  if (!hasGaps && input.decision.state.stage !== "FALLBACK") return null;
  return input.orchestrator.extractLeadFields({
    conversation: input.input,
    decision: input.decision,
  });
}

function intentOverrideFor(
  decision: ConversationEngineDecision,
  result: LlmTaskResult<LlmIntentClassification> | null,
) {
  if (!result?.ok) return undefined;
  if (result.value.intent === "UNKNOWN") return undefined;
  if (
    decision.intent === "UNKNOWN" ||
    decision.intentConfidence < 0.5 ||
    result.value.confidence >= 0.82
  ) {
    return {
      intent: result.value.intent,
      confidence: Math.max(result.value.confidence, decision.intentConfidence),
    };
  }
  return undefined;
}

function localeOverrideFor(
  input: ConversationEngineInput,
  result: LlmTaskResult<LlmLanguageDetection> | null,
): EngineLocale | undefined {
  if (!result?.ok || result.value.needsConfirmation) return undefined;
  if (result.value.confidence < 0.72) return undefined;
  if (input.workspace.languageMode === "GREEK") return "EL";
  if (input.workspace.languageMode === "ENGLISH") return "EN";
  return result.value.locale;
}

function collectResult<T>(
  result: LlmTaskResult<T> | null,
  traces: LlmTaskTrace[],
  fallbackReasons: string[],
) {
  if (!result) return;
  traces.push(result.trace);
  if (!result.ok) fallbackReasons.push(`${result.trace.task}: ${result.fallbackReason}`);
}

function aiMetadata(input: {
  provider: string;
  traces: LlmTaskTrace[];
  usedGeneratedReply: boolean;
  fallbackReasons: string[];
}): ConversationEngineAiMetadata {
  return {
    provider: input.provider,
    tasks: [...input.traces],
    usedGeneratedReply: input.usedGeneratedReply,
    fallbackReasons: [...input.fallbackReasons],
  };
}

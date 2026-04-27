import { safeErrorMessage, sanitizeLogValue } from "@/lib/security/logging";
import type { LlmTaskTrace } from "@/lib/llm/types";

export function recordLlmTrace(trace: LlmTaskTrace) {
  if (process.env.NODE_ENV === "test" || process.env.NORTHLINE_LLM_TRACE === "0") {
    return;
  }

  const level = trace.success ? "info" : "warn";
  console[level](
    trace.success ? "northline.llm.task_succeeded" : "northline.llm.task_failed",
    sanitizeLogValue(trace),
  );
}

export function llmErrorMessage(error: unknown) {
  return safeErrorMessage(error);
}

import type { LlmMode, LlmProviderConfig } from "@/lib/llm/types";

const defaultFastModel = "llama-3.1-8b-instant";
const defaultGenerationModel = "llama-3.3-70b-versatile";
const defaultGroqBaseUrl = "https://api.groq.com/openai/v1";

export function resolveLlmProviderConfig(
  env: NodeJS.ProcessEnv = process.env,
): LlmProviderConfig {
  const configuredMode = parseMode(env.NORTHLINE_LLM_MODE);
  const mode = configuredMode ?? inferMode(env);

  return {
    mode,
    timeoutMs: parsePositiveInt(env.NORTHLINE_LLM_TIMEOUT_MS, 8_000),
    retryCount: parsePositiveInt(env.NORTHLINE_LLM_RETRY_COUNT, 1),
    groq: {
      apiKey: clean(env.GROQ_API_KEY),
      baseUrl: clean(env.GROQ_BASE_URL) ?? defaultGroqBaseUrl,
      fastModel: clean(env.NORTHLINE_LLM_FAST_MODEL) ?? defaultFastModel,
      generationModel:
        clean(env.NORTHLINE_LLM_GENERATION_MODEL) ?? defaultGenerationModel,
    },
  };
}

function inferMode(env: NodeJS.ProcessEnv): LlmMode {
  if (env.NODE_ENV === "test") return "mock";
  if (clean(env.GROQ_API_KEY)) return "groq";
  if (env.NODE_ENV === "production") return "off";
  return "mock";
}

function parseMode(value?: string): LlmMode | null {
  const normalized = clean(value)?.toLowerCase();
  if (
    normalized === "off" ||
    normalized === "mock" ||
    normalized === "groq"
  ) {
    return normalized;
  }
  return null;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

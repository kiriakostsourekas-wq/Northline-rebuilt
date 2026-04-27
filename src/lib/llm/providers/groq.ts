import type {
  LlmModelClass,
  LlmProvider,
  LlmProviderConfig,
  LlmProviderRequest,
  LlmProviderResponse,
  LlmTokenUsage,
} from "@/lib/llm/types";

export class LlmProviderError extends Error {
  readonly retryable: boolean;
  readonly status?: number;

  constructor(message: string, options: { retryable?: boolean; status?: number } = {}) {
    super(message);
    this.name = "LlmProviderError";
    this.retryable = options.retryable ?? false;
    this.status = options.status;
  }
}

export class GroqLlmProvider implements LlmProvider {
  readonly name = "groq" as const;
  readonly isEnabled: boolean;

  constructor(private readonly config: LlmProviderConfig) {
    this.isEnabled = Boolean(config.groq.apiKey);
  }

  async invoke(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    if (!this.config.groq.apiKey) {
      throw new LlmProviderError("Groq API key is not configured.");
    }

    const retries = Math.max(0, this.config.retryCount);
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await this.invokeOnce(request);
      } catch (error) {
        lastError = error;
        if (!isRetryable(error) || attempt === retries) break;
        await wait(150 * (attempt + 1));
      }
    }

    throw lastError;
  }

  private async invokeOnce(request: LlmProviderRequest) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs);

    try {
      const response = await fetch(
        `${this.config.groq.baseUrl.replace(/\/$/, "")}/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.groq.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelFor(request.modelClass, this.config),
            messages: request.messages,
            temperature: request.temperature,
            max_completion_tokens: request.maxOutputTokens,
            response_format:
              request.responseFormat === "json" ? { type: "json_object" } : undefined,
            stream: false,
            citation_options: "disabled",
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new LlmProviderError(`Groq request failed with ${response.status}.`, {
          retryable: response.status === 429 || response.status >= 500,
          status: response.status,
        });
      }

      return parseGroqResponse(await response.json());
    } catch (error) {
      if (error instanceof LlmProviderError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new LlmProviderError("Groq request timed out.", { retryable: true });
      }
      throw new LlmProviderError("Groq request failed.", { retryable: true });
    } finally {
      clearTimeout(timeout);
    }
  }
}

function modelFor(modelClass: LlmModelClass, config: LlmProviderConfig) {
  return modelClass === "fast"
    ? config.groq.fastModel
    : config.groq.generationModel;
}

function parseGroqResponse(value: unknown): LlmProviderResponse {
  const record = objectValue(value);
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const first = objectValue(choices[0]);
  const message = objectValue(first.message);
  const content = typeof message.content === "string" ? message.content : "";
  if (!content.trim()) {
    throw new LlmProviderError("Groq response did not include content.");
  }

  const usage = usageValue(record.usage);
  const xGroq = objectValue(record.x_groq);
  return {
    content,
    model: typeof record.model === "string" ? record.model : undefined,
    requestId: typeof xGroq.id === "string" ? xGroq.id : undefined,
    usage,
  };
}

function usageValue(value: unknown): LlmTokenUsage | undefined {
  const usage = objectValue(value);
  const inputTokens = numberValue(usage.prompt_tokens);
  const outputTokens = numberValue(usage.completion_tokens);
  const totalTokens = numberValue(usage.total_tokens);
  if (!inputTokens && !outputTokens && !totalTokens) return undefined;
  return {
    inputTokens,
    outputTokens,
    totalTokens,
  };
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isRetryable(error: unknown) {
  return error instanceof LlmProviderError && error.retryable;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { analyzeText } from "@/lib/language/normalization";
import { hashContent } from "@/lib/knowledge/chunking";

export type EmbeddingMode = "off" | "mock" | "openai";
export type EmbeddingProviderName = "disabled" | "mock" | "openai";

export type EmbeddingProviderConfig = {
  mode: EmbeddingMode;
  timeoutMs: number;
  openai: {
    apiKey?: string;
    baseUrl: string;
    model: string;
    dimensions?: number;
  };
  mock: {
    dimensions: number;
  };
};

export type EmbeddingRequest = {
  texts: string[];
  timeoutMs?: number;
};

export type EmbeddingResponse = {
  embeddings: number[][];
  model: string;
  dimensions: number;
  usage?: {
    inputTokens?: number;
    totalTokens?: number;
  };
};

export interface EmbeddingProvider {
  readonly name: EmbeddingProviderName;
  readonly isEnabled: boolean;
  readonly model: string;
  readonly dimensions?: number;
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}

const defaultOpenAiBaseUrl = "https://api.openai.com/v1";
const defaultOpenAiEmbeddingModel = "text-embedding-3-small";

export function resolveEmbeddingProviderConfig(
  env: NodeJS.ProcessEnv = process.env,
): EmbeddingProviderConfig {
  const mode = parseMode(env.NORTHLINE_EMBEDDINGS_MODE) ?? inferMode(env);
  return {
    mode,
    timeoutMs: positiveInt(env.NORTHLINE_EMBEDDINGS_TIMEOUT_MS, 8_000),
    openai: {
      apiKey: clean(env.OPENAI_API_KEY),
      baseUrl: clean(env.OPENAI_BASE_URL) ?? defaultOpenAiBaseUrl,
      model:
        clean(env.NORTHLINE_EMBEDDINGS_MODEL) ?? defaultOpenAiEmbeddingModel,
      dimensions: optionalPositiveInt(env.NORTHLINE_EMBEDDINGS_DIMENSIONS),
    },
    mock: {
      dimensions: positiveInt(
        env.NORTHLINE_MOCK_EMBEDDINGS_DIMENSIONS ??
          env.NORTHLINE_EMBEDDINGS_DIMENSIONS,
        96,
      ),
    },
  };
}

export function createEmbeddingProviderFromEnv(
  env: NodeJS.ProcessEnv = process.env,
) {
  return createEmbeddingProvider(resolveEmbeddingProviderConfig(env));
}

export function createEmbeddingProvider(
  config: EmbeddingProviderConfig,
): EmbeddingProvider {
  if (config.mode === "off") return new DisabledEmbeddingProvider();
  if (config.mode === "mock") {
    return new MockEmbeddingProvider(config.mock.dimensions);
  }
  if (!config.openai.apiKey) return new DisabledEmbeddingProvider();
  return new OpenAiEmbeddingProvider(config);
}

export class DisabledEmbeddingProvider implements EmbeddingProvider {
  readonly name = "disabled" as const;
  readonly isEnabled = false;
  readonly model = "disabled";
  readonly dimensions = 0;

  async embed(): Promise<EmbeddingResponse> {
    throw new Error("Embedding provider is disabled.");
  }
}

export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = "mock" as const;
  readonly isEnabled = true;
  readonly model = "northline-mock-embedding";

  constructor(readonly dimensions = 96) {}

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return {
      embeddings: request.texts.map((text) =>
        normalizeVector(featureHashVector(text, this.dimensions)),
      ),
      model: this.model,
      dimensions: this.dimensions,
      usage: {
        inputTokens: request.texts.reduce(
          (total, text) => total + Math.ceil(text.length / 4),
          0,
        ),
      },
    };
  }
}

class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai" as const;
  readonly isEnabled = true;
  readonly model: string;
  readonly dimensions?: number;

  constructor(private readonly config: EmbeddingProviderConfig) {
    this.model = config.openai.model;
    this.dimensions = config.openai.dimensions;
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      request.timeoutMs ?? this.config.timeoutMs,
    );

    try {
      const response = await fetch(
        `${this.config.openai.baseUrl.replace(/\/$/, "")}/embeddings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.openai.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.model,
            input: request.texts,
            encoding_format: "float",
            dimensions: this.dimensions,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Embedding request failed with ${response.status}.`);
      }

      const payload = (await response.json()) as {
        data?: Array<{ index: number; embedding: number[] }>;
        model?: string;
        usage?: { prompt_tokens?: number; total_tokens?: number };
      };
      const data = [...(payload.data ?? [])].sort((a, b) => a.index - b.index);
      const embeddings = data.map((item) => item.embedding);
      const dimensions = embeddings[0]?.length ?? this.dimensions ?? 0;

      if (embeddings.length !== request.texts.length || dimensions === 0) {
        throw new Error("Embedding response did not match the request.");
      }

      return {
        embeddings,
        model: payload.model ?? this.model,
        dimensions,
        usage: {
          inputTokens: payload.usage?.prompt_tokens,
          totalTokens: payload.usage?.total_tokens,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function embeddingHash(input: {
  provider: string;
  model: string;
  text: string;
}) {
  return hashContent([input.provider, input.model, input.text]);
}

function featureHashVector(text: string, dimensions: number) {
  const vector = Array.from({ length: dimensions }, () => 0);
  for (const term of termsForEmbedding(text)) {
    const hash = hashTerm(term);
    const index = Math.abs(hash) % dimensions;
    vector[index] += hash < 0 ? -1 : 1;
  }
  return vector;
}

function termsForEmbedding(text: string) {
  const analysis = analyzeText(text);
  return analysis.searchText.split(/\s+/).filter((term) => term.length > 1);
}

function hashTerm(term: string) {
  let hash = 0;
  for (let index = 0; index < term.length; index += 1) {
    hash = (hash << 5) - hash + term.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(
    vector.reduce((total, value) => total + value * value, 0),
  );
  if (!magnitude) return vector;
  return vector.map((value) => value / magnitude);
}

function inferMode(env: NodeJS.ProcessEnv): EmbeddingMode {
  if (env.NODE_ENV === "test") return "mock";
  if (clean(env.OPENAI_API_KEY)) return "openai";
  if (env.NODE_ENV === "production") return "off";
  return "mock";
}

function parseMode(value?: string): EmbeddingMode | null {
  const normalized = clean(value)?.toLowerCase();
  if (normalized === "off" || normalized === "mock" || normalized === "openai") {
    return normalized;
  }
  return null;
}

function clean(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function positiveInt(value: string | undefined, fallback: number) {
  return optionalPositiveInt(value) ?? fallback;
}

function optionalPositiveInt(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

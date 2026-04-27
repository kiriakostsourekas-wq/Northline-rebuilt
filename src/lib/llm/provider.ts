import { resolveLlmProviderConfig } from "@/lib/llm/config";
import { GroqLlmProvider } from "@/lib/llm/providers/groq";
import { MockLlmProvider } from "@/lib/llm/providers/mock";
import type {
  LlmProvider,
  LlmProviderConfig,
  LlmProviderResponse,
} from "@/lib/llm/types";

class DisabledLlmProvider implements LlmProvider {
  readonly name = "disabled" as const;
  readonly isEnabled = false;

  async invoke(): Promise<LlmProviderResponse> {
    throw new Error("LLM provider is disabled.");
  }
}

export function createLlmProviderFromEnv(env: NodeJS.ProcessEnv = process.env) {
  return createLlmProvider(resolveLlmProviderConfig(env));
}

export function createLlmProvider(config: LlmProviderConfig): LlmProvider {
  if (config.mode === "off") return new DisabledLlmProvider();
  if (config.mode === "mock") return new MockLlmProvider();
  if (!config.groq.apiKey) return new DisabledLlmProvider();
  return new GroqLlmProvider(config);
}

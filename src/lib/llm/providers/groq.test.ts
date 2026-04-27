import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveLlmProviderConfig } from "@/lib/llm/config";
import { GroqLlmProvider } from "@/lib/llm/providers/groq";
import type { LlmProviderRequest } from "@/lib/llm/types";

describe("Groq LLM provider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls Groq chat completions with JSON mode for structured tasks", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          model: "llama-3.1-8b-instant",
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: "BOOKING_REQUEST",
                  confidence: 0.9,
                }),
              },
            },
          ],
          usage: {
            prompt_tokens: 20,
            completion_tokens: 8,
            total_tokens: 28,
          },
          x_groq: { id: "req_test" },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new GroqLlmProvider(
      resolveLlmProviderConfig({
        NODE_ENV: "test",
        NORTHLINE_LLM_MODE: "groq",
        GROQ_API_KEY: "test_key",
      }),
    );

    const response = await provider.invoke(makeRequest());

    expect(response.content).toContain("BOOKING_REQUEST");
    expect(response.usage).toEqual({
      inputTokens: 20,
      outputTokens: 8,
      totalTokens: 28,
    });
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    const [url, init] = calls[0];
    const headers = init.headers as Record<string, string>;
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(headers.Authorization).toBe("Bearer test_key");
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      stream: false,
    });
  });

  it("retries retryable Groq failures once", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            model: "llama-3.1-8b-instant",
            choices: [{ message: { content: "{\"ok\":true}" } }],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new GroqLlmProvider(
      resolveLlmProviderConfig({
        NODE_ENV: "test",
        NORTHLINE_LLM_MODE: "groq",
        GROQ_API_KEY: "test_key",
        NORTHLINE_LLM_RETRY_COUNT: "1",
      }),
    );

    const response = await provider.invoke(makeRequest());

    expect(response.content).toBe("{\"ok\":true}");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

function makeRequest(): LlmProviderRequest {
  return {
    id: "test.prompt",
    version: "v1",
    task: "intent_classification",
    modelClass: "fast",
    responseFormat: "json",
    temperature: 0,
    maxOutputTokens: 100,
    timeoutMs: 1_000,
    messages: [{ role: "user", content: "Book a demo." }],
  };
}

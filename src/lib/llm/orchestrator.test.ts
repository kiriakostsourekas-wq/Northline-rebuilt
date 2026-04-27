import { describe, expect, it } from "vitest";
import type {
  LlmProvider,
  LlmProviderRequest,
  LlmProviderResponse,
} from "@/lib/llm/types";
import { MockLlmProvider } from "@/lib/llm/providers/mock";
import { createNorthlineLlmOrchestrator } from "@/lib/llm/orchestrator";
import { makeLlmConversationInput } from "@/lib/llm/test-fixtures";
import { runConversationEngine } from "@/lib/conversation-engine/engine";

describe("Northline LLM orchestration contracts", () => {
  it("classifies intent through a provider-specific task interface", async () => {
    const conversation = makeLlmConversationInput({
      latestMessage: "Please book a demo for AI sales assistant setup.",
      includeBooking: true,
    });
    const orchestrator = createNorthlineLlmOrchestrator(new MockLlmProvider());

    const result = await orchestrator.classifyIntent({ conversation });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.intent).toBe("BOOKING_REQUEST");
    expect(result.trace.task).toBe("intent_classification");
    expect(result.trace.provider).toBe("mock");
  });

  it("detects Greeklish as Greek when the language policy is bilingual", async () => {
    const conversation = makeLlmConversationInput({
      latestMessage: "Kalispera, thelo rantevou gia demo stin Athina.",
      includeBooking: true,
    });
    const orchestrator = createNorthlineLlmOrchestrator(new MockLlmProvider());

    const result = await orchestrator.detectLanguageOrConfirm({ conversation });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.locale).toBe("EL");
    expect(result.value.needsConfirmation).toBe(false);
  });

  it("extracts structured lead fields without replacing deterministic rules", async () => {
    const conversation = makeLlmConversationInput({
      latestMessage:
        "I am Maria Demo, email maria@example.com. Please book a demo in Athens next week.",
      includeBooking: true,
    });
    const orchestrator = createNorthlineLlmOrchestrator(new MockLlmProvider());

    const result = await orchestrator.extractLeadFields({ conversation });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.fields).toMatchObject({
      email: "maria@example.com",
      location: "Athens",
      bookingIntent: true,
    });
  });

  it("returns a controlled failure when the provider is disabled", async () => {
    const conversation = makeLlmConversationInput({
      latestMessage: "I need details.",
    });
    const orchestrator = createNorthlineLlmOrchestrator(disabledProvider);

    const result = await orchestrator.classifyIntent({ conversation });

    expect(result.ok).toBe(false);
    expect(result.trace.provider).toBe("disabled");
    expect(result.trace.success).toBe(false);
  });

  it("turns provider errors into fallback results without throwing", async () => {
    const conversation = makeLlmConversationInput({
      latestMessage: "How much does this cost?",
    });
    const orchestrator = createNorthlineLlmOrchestrator(failingProvider);

    const result = await orchestrator.classifyIntent({ conversation });

    expect(result.ok).toBe(false);
    expect(result.trace.success).toBe(false);
    if (result.ok) throw new Error("Expected provider failure.");
    expect(result.fallbackReason).toMatch(/provider failed/i);
  });

  it("rejects unsafe generated replies and falls back to deterministic text", async () => {
    const conversation = makeLlmConversationInput({
      latestMessage: "I need AI sales assistant setup.",
      includeBooking: true,
      includePricing: true,
    });
    const decision = runConversationEngine(conversation);
    const orchestrator = createNorthlineLlmOrchestrator(unsafeReplyProvider);

    const result = await orchestrator.generateReply({ conversation, decision });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected unsafe reply rejection.");
    expect(result.fallbackReason).toMatch(/unsupported promise/i);
  });
});

const disabledProvider: LlmProvider = {
  name: "disabled",
  isEnabled: false,
  async invoke() {
    throw new Error("Should not be invoked.");
  },
};

const failingProvider: LlmProvider = {
  name: "mock",
  isEnabled: true,
  async invoke() {
    throw new Error("Provider failed.");
  },
};

const unsafeReplyProvider: LlmProvider = {
  name: "mock",
  isEnabled: true,
  async invoke(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    return {
      content:
        request.task === "reply_generation"
          ? JSON.stringify({
              reply: "We guarantee this will be approved tomorrow.",
              confidence: 0.9,
            })
          : JSON.stringify({}),
    };
  },
};

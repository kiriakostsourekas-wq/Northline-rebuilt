import { describe, expect, it } from "vitest";
import { runConversationEngineWithLlm } from "@/lib/conversation-engine/llm-enhanced-engine";
import { MockLlmProvider } from "@/lib/llm/providers/mock";
import { makeLlmConversationInput } from "@/lib/llm/test-fixtures";

describe("LLM-enhanced conversation engine", () => {
  it("uses LLM tasks as an additive layer around deterministic workflow state", async () => {
    const decision = await runConversationEngineWithLlm(
      makeLlmConversationInput({
        latestMessage:
          "I am Maria Demo. Please book a demo for AI sales assistant setup next week. Email maria@example.com.",
        includeBooking: true,
        includePricing: true,
      }),
      { provider: new MockLlmProvider() },
    );

    expect(decision.intent).toBe("BOOKING_REQUEST");
    expect(decision.state.stage).toBe("BOOKING_READY");
    expect(decision.ai?.provider).toBe("mock");
    expect(decision.ai?.tasks.map((task) => task.task)).toContain(
      "reply_generation",
    );
    expect(decision.ai?.usedGeneratedReply).toBe(true);
  });

  it("does not let LLM reply generation bypass missing business-context safeguards", async () => {
    const decision = await runConversationEngineWithLlm(
      makeLlmConversationInput({
        latestMessage:
          "How much does this cost for AI sales assistant setup in Athens?",
        includePricing: false,
        includeBooking: true,
      }),
      { provider: new MockLlmProvider() },
    );

    expect(decision.intent).toBe("PRICING_QUESTION");
    expect(decision.shouldEscalate).toBe(true);
    expect(decision.reply).toContain("I do not want to guess");
    expect(decision.ai?.usedGeneratedReply).toBe(false);
    expect(decision.ai?.tasks.map((task) => task.task)).not.toContain(
      "reply_generation",
    );
  });

  it("falls back cleanly when the provider is disabled", async () => {
    const decision = await runConversationEngineWithLlm(
      makeLlmConversationInput({
        latestMessage: "Hi",
        includeBooking: true,
      }),
      {
        provider: {
          name: "disabled",
          isEnabled: false,
          async invoke() {
            throw new Error("Should not run.");
          },
        },
      },
    );

    expect(decision.state.stage).toBe("FALLBACK");
    expect(decision.reply).toContain("need a little more context");
    expect(decision.ai?.fallbackReasons.length).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from "vitest";
import {
  isAiPausedForHandoff,
  resolveAutomaticHandoff,
} from "@/lib/handoff/rules";
import type { ConversationEngineDecision } from "@/lib/conversation-engine/types";

describe("handoff rules", () => {
  it("treats paused AI and active handoffs as automation blockers", () => {
    expect(
      isAiPausedForHandoff({
        aiResponderState: "PAUSED",
        activeHandoffStatus: null,
      }),
    ).toBe(true);
    expect(
      isAiPausedForHandoff({
        aiResponderState: "ACTIVE",
        activeHandoffStatus: "ACCEPTED",
      }),
    ).toBe(true);
    expect(
      isAiPausedForHandoff({
        aiResponderState: "ACTIVE",
        activeHandoffStatus: "RESOLVED",
      }),
    ).toBe(false);
  });

  it("requests handoff for explicit engine escalation", () => {
    const decision = makeDecision({
      shouldEscalate: true,
      escalationReason: "Lead requested support or human handoff.",
    });

    expect(
      resolveAutomaticHandoff({
        decision,
        latestMessage: "Can I talk with a human?",
      }),
    ).toMatchObject({
      shouldHandoff: true,
      trigger: "engine_escalation",
      reason: "Lead requested support or human handoff.",
    });
  });

  it("requests handoff for fallback or low-confidence states", () => {
    const decision = makeDecision({
      intent: "UNKNOWN",
      intentConfidence: 0.25,
      confidence: 0.3,
      state: {
        stage: "FALLBACK",
        lastIntent: "UNKNOWN",
        missingFields: ["service_interest"],
        replyLocale: "EN",
        confidence: 0.3,
      },
    });

    expect(
      resolveAutomaticHandoff({ decision, latestMessage: "Hi" }),
    ).toMatchObject({
      shouldHandoff: true,
      trigger: "low_confidence",
    });
  });

  it("requests handoff for sensitive Greek and English issues", () => {
    const decision = makeDecision();

    expect(
      resolveAutomaticHandoff({
        decision,
        latestMessage: "This is unacceptable, I need a refund and GDPR details.",
      }),
    ).toMatchObject({ shouldHandoff: true, trigger: "sensitive_issue" });
    expect(
      resolveAutomaticHandoff({
        decision,
        latestMessage: "Έχω παράπονο και θέλω να μιλήσω με υπεύθυνο.",
      }),
    ).toMatchObject({ shouldHandoff: true });
  });

  it("requests handoff for urgent or high-value leads", () => {
    const decision = makeDecision({
      score: 72,
      mergedLead: {
        budget: "1500 EUR",
        urgency: "this week",
      },
    });

    expect(
      resolveAutomaticHandoff({
        decision,
        latestMessage: "We can start this week.",
      }),
    ).toMatchObject({
      shouldHandoff: true,
      trigger: "urgent_or_high_value",
    });
  });
});

function makeDecision(
  overrides: Partial<ConversationEngineDecision> = {},
): ConversationEngineDecision {
  return {
    intent: "NEW_LEAD_INQUIRY",
    intentConfidence: 0.72,
    replyLocale: "EN",
    extractedFields: {},
    mergedLead: {},
    missingFields: ["contact_method"],
    askedFields: ["contact_method"],
    reply: "Thanks, can you share the best contact details?",
    nextConversationStatus: "WAITING_ON_LEAD",
    leadStatus: "QUALIFYING",
    score: 40,
    confidence: 0.7,
    shouldEscalate: false,
    summary: "New lead inquiry.",
    internalNotes: "No handoff yet.",
    state: {
      stage: "COLLECTING_DETAILS",
      lastIntent: "NEW_LEAD_INQUIRY",
      missingFields: ["contact_method"],
      replyLocale: "EN",
      confidence: 0.7,
    },
    ...overrides,
  };
}

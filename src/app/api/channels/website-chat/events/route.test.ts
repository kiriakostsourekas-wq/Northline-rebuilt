import { describe, expect, it } from "vitest";
import {
  buildWebsiteChatResponseBody,
  toWebsiteChatAssistantResult,
} from "@/app/api/channels/website-chat/events/route";
import type { ConversationEngineDecision } from "@/lib/conversation-engine/types";

describe("website chat route response helpers", () => {
  it("maps conversation engine decisions to public assistant metadata", () => {
    expect(toWebsiteChatAssistantResult(makeDecision())).toEqual({
      reply: "Thanks, I can help. What timeline are you working with?",
      locale: "EN",
      leadStatus: "QUALIFYING",
      missingFields: ["urgency"],
      shouldEscalate: false,
    });
  });

  it("includes assistant metadata for processed inbound events", () => {
    const assistant = toWebsiteChatAssistantResult(makeDecision());

    expect(
      buildWebsiteChatResponseBody(
        {
          status: "processed",
          conversationId: "conversation_1",
          leadId: "lead_1",
          messageId: "message_1",
        },
        assistant,
      ),
    ).toEqual({
      status: "processed",
      conversationId: "conversation_1",
      leadId: "lead_1",
      messageId: "message_1",
      assistant,
    });
  });

  it("keeps duplicate event responses idempotent and assistant-free", () => {
    expect(
      buildWebsiteChatResponseBody(
        { status: "duplicate", eventId: "event_existing" },
        toWebsiteChatAssistantResult(makeDecision()),
      ),
    ).toEqual({ status: "duplicate", eventId: "event_existing" });
  });
});

function makeDecision(): ConversationEngineDecision {
  return {
    intent: "NEW_LEAD_INQUIRY",
    intentConfidence: 0.74,
    replyLocale: "EN",
    extractedFields: { serviceInterest: "Website chat" },
    mergedLead: {
      id: "lead_1",
      serviceInterest: "Website chat",
      bookingIntent: false,
    },
    missingFields: ["urgency"],
    askedFields: ["urgency"],
    reply: "Thanks, I can help. What timeline are you working with?",
    nextConversationStatus: "WAITING_ON_LEAD",
    leadStatus: "QUALIFYING",
    score: 42,
    confidence: 0.7,
    shouldEscalate: false,
    summary: "Lead asked about website chat.",
    internalNotes: "Missing timeline.",
    state: {
      stage: "COLLECTING_DETAILS",
      lastIntent: "NEW_LEAD_INQUIRY",
      missingFields: ["urgency"],
      replyLocale: "EN",
      confidence: 0.7,
    },
  };
}

import type {
  LlmProvider,
  LlmProviderRequest,
  LlmProviderResponse,
} from "@/lib/llm/types";

export class MockLlmProvider implements LlmProvider {
  readonly name = "mock" as const;
  readonly isEnabled = true;

  async invoke(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    return {
      content: mockContent(request),
      model: "northline-mock-model",
      requestId: `mock_${request.task}`,
      usage: estimateUsage(request),
    };
  }
}

function mockContent(request: LlmProviderRequest) {
  const content = request.messages.map((message) => message.content).join("\n");
  const latestMessage = latestMessageFrom(content);
  const text = latestMessage.toLowerCase();

  switch (request.task) {
    case "intent_classification":
      return JSON.stringify({
        intent: intentFor(text),
        confidence: text.includes("hi") && text.length < 200 ? 0.42 : 0.82,
      });
    case "language_detection":
      return JSON.stringify({
        locale: /καλη|θέλω|ραντεβ|kalispera|thelo|rantevou|athina/i.test(latestMessage)
          ? "EL"
          : "EN",
        confidence: 0.84,
        needsConfirmation: false,
      });
    case "field_extraction":
      return JSON.stringify({
        fields: extractFields(latestMessage),
        confidence: 0.78,
      });
    case "reply_generation":
      return JSON.stringify({
        reply: /"replyLocale": "EL"/.test(content)
          ? "Ευχαριστώ. Έχω κρατήσει τα βασικά στοιχεία και θα σας καθοδηγήσω στο επόμενο βήμα."
          : "Thanks. I have the key details and can guide you to the next step.",
        confidence: 0.77,
      });
    case "conversation_summary":
      return JSON.stringify({
        summary:
          "Inbound lead conversation summarized with known qualification details, missing fields, and current workflow state.",
        confidence: 0.76,
      });
    case "handoff_summary":
      return JSON.stringify({
        summary:
          "Handoff needed for human review. Review the approved business context, confirm missing lead details, and reply directly.",
        recommendedNextStep:
          "Operator should review context and send a direct follow-up.",
        confidence: 0.78,
      });
  }
}

function latestMessageFrom(content: string) {
  const match = content.match(/"latestMessage":\s*"((?:\\"|[^"])*)"/);
  return match?.[1] ? match[1].replace(/\\"/g, "\"") : content;
}

function intentFor(text: string) {
  if (/\b(human|person|operator|agent|support|manager|complaint)\b/.test(text)) {
    return "HUMAN_HANDOFF";
  }
  if (/\b(book|booking|schedule|appointment|meeting|demo|call|rantevou)\b/.test(text)) {
    return "BOOKING_REQUEST";
  }
  if (/\b(price|pricing|cost|quote|budget|how much|timi|kostos|poso)\b/.test(text)) {
    return "PRICING_QUESTION";
  }
  if (/\b(available|availability|service area|do you offer|can you help)\b/.test(text)) {
    return "SERVICE_AVAILABILITY";
  }
  if (text.trim().length < 40) return "UNKNOWN";
  return "NEW_LEAD_INQUIRY";
}

function extractFields(content: string) {
  const fields: Record<string, string | boolean> = {};
  const email = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = content.match(/\+?\d[\d\s().-]{7,}\d/)?.[0];
  const name = content.match(/\b(?:my name is|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/)?.[1];
  const budget = content.match(/(?:€|\b(?:eur|euro|budget)\b)?\s*(\d[\d.,]*\s?(?:eur|euro|€)?)/i)?.[1];

  if (email) fields.email = email.toLowerCase();
  if (phone) fields.phone = phone.replace(/[^\d+]/g, "");
  if (name) fields.name = name;
  if (/athens|athina|αθήνα|αθηνα/i.test(content)) fields.location = "Athens";
  if (/this week|next week|tomorrow|today|avrio|αύριο|αυριο/i.test(content)) {
    fields.urgency = "this week";
  }
  if (/demo|book|booking|ραντεβ|rantevou/i.test(content)) {
    fields.bookingIntent = true;
  }
  if (budget && /\d/.test(budget)) fields.budget = budget.trim();
  if (/ai sales assistant setup/i.test(content)) {
    fields.serviceInterest = "AI sales assistant setup";
  }

  return fields;
}

function estimateUsage(request: LlmProviderRequest) {
  const promptChars = request.messages.reduce(
    (total, message) => total + message.content.length,
    0,
  );
  return {
    inputTokens: Math.ceil(promptChars / 4),
    outputTokens: Math.min(120, request.maxOutputTokens),
    totalTokens: Math.ceil(promptChars / 4) + Math.min(120, request.maxOutputTokens),
  };
}

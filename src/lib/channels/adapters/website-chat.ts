import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  ChannelAdapter,
  NormalizeInboundInput,
  NormalizedInboundEvent,
  OutboundSendInput,
  OutboundSendResult,
  WebhookVerificationInput,
  WebhookVerificationResult,
} from "@/lib/channels/types";
import { analyzeText } from "@/lib/language";
import { isStrictProductionRuntime } from "@/lib/security/runtime";

export const websiteChatAdapter: ChannelAdapter = {
  provider: "website_chat",
  channelType: "WEBSITE_CHAT",
  displayName: "Website chat",
  configured: true,
  verifyWebhook,
  normalizeInbound,
  async sendMessage(input: OutboundSendInput): Promise<OutboundSendResult> {
    const sentAt = new Date();

    return {
      ok: true,
      externalMessageId: `local_web_${input.idempotencyKey}`,
      sentAt,
      providerResponse: {
        mode: "local-simulator",
        conversationId: input.conversationId,
      },
    };
  },
};

function verifyWebhook({
  headers,
  rawBody,
}: WebhookVerificationInput): WebhookVerificationResult {
  const expectedSecret = process.env.NORTHLINE_WEBSITE_CHAT_SECRET;
  if (!expectedSecret) {
    if (isStrictProductionRuntime()) {
      return {
        ok: false,
        status: 503,
        message: "Website chat webhook secret is not configured.",
      };
    }
    return { ok: true };
  }

  const signature = headers.get("x-northline-signature");
  if (signature && rawBody) {
    return verifySignature({
      signature,
      rawBody,
      secret: expectedSecret,
    });
  }

  if (isStrictProductionRuntime()) {
    return {
      ok: false,
      status: 401,
      message: "Website chat webhook signature is required.",
    };
  }

  const receivedSecret =
    headers.get("x-northline-webhook-secret") ??
    headers.get("x-northline-secret");

  if (receivedSecret !== expectedSecret) {
    return {
      ok: false,
      status: 401,
      message: "Invalid website chat webhook secret.",
    };
  }

  return { ok: true };
}

function verifySignature(input: {
  signature: string;
  rawBody: string;
  secret: string;
}): WebhookVerificationResult {
  const expected = `sha256=${createHmac("sha256", input.secret)
    .update(input.rawBody)
    .digest("hex")}`;
  const received = Buffer.from(input.signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    received.length !== expectedBuffer.length ||
    !timingSafeEqual(received, expectedBuffer)
  ) {
    return {
      ok: false,
      status: 401,
      message: "Invalid website chat webhook signature.",
    };
  }

  return { ok: true };
}

function normalizeInbound({
  organizationId,
  payload,
}: NormalizeInboundInput): NormalizedInboundEvent {
  const messageBody = getRequiredString(payload, "message");
  const visitorId =
    getString(payload, "visitorId") ??
    getString(payload, "contactId") ??
    getString(payload, "email") ??
    getString(payload, "phone");
  if (!visitorId) {
    throw new Error("Website chat inbound payload requires visitorId, email, or phone.");
  }

  const threadId =
    getString(payload, "threadId") ??
    getString(payload, "sessionId") ??
    visitorId;
  const messageId =
    getString(payload, "messageId") ??
    `${threadId}:${Date.parse(getString(payload, "timestamp") ?? "") || Date.now()}`;
  const eventId = getString(payload, "eventId") ?? `website:${messageId}`;

  return {
    organizationId,
    provider: "website_chat",
    channelType: "WEBSITE_CHAT",
    externalAccountId: getString(payload, "widgetId") ?? "local-widget",
    externalEventId: eventId,
    eventType: getString(payload, "eventType") ?? "message.created",
    externalThreadId: threadId,
    contact: {
      externalContactId: visitorId,
      displayName: getString(payload, "name"),
      email: getString(payload, "email")?.toLowerCase(),
      phone: getString(payload, "phone"),
      handle: getString(payload, "handle"),
    },
    message: {
      externalMessageId: messageId,
      body: messageBody,
      occurredAt: parseDate(getString(payload, "timestamp")),
      locale: parseLocale(getString(payload, "locale"), messageBody),
    },
    rawPayload: payload,
  };
}

function getString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getRequiredString(payload: Record<string, unknown>, key: string) {
  const value = getString(payload, key);
  if (!value) throw new Error(`Website chat inbound payload requires ${key}.`);
  return value;
}

function parseDate(value?: string) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseLocale(value: string | undefined, messageBody: string) {
  const normalized = value?.toLowerCase();
  if (normalized?.startsWith("el")) return "EL";
  if (normalized?.startsWith("en")) return "EN";
  const analysis = analyzeText(messageBody);
  if (
    analysis.detection.language === "GREEK" ||
    analysis.detection.language === "GREEKLISH" ||
    analysis.detection.language === "MIXED"
  ) {
    return "EL";
  }
  if (analysis.detection.language === "ENGLISH") return "EN";
  return undefined;
}

export type ChannelTypeValue =
  | "WEBSITE_CHAT"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "FACEBOOK_MESSENGER"
  | "TELEGRAM"
  | "VIBER"
  | "EMAIL"
  | "API";

export type ConversationStatusValue =
  | "OPEN"
  | "WAITING_ON_LEAD"
  | "WAITING_ON_BUSINESS"
  | "CLOSED";

export type ChannelProvider =
  | "website_chat"
  | "whatsapp"
  | "instagram"
  | "messenger"
  | "telegram"
  | "viber"
  | "email";

export type ContactProfile = {
  externalContactId: string;
  displayName?: string;
  email?: string;
  phone?: string;
  handle?: string;
};

export type NormalizedInboundEvent = {
  organizationId: string;
  provider: ChannelProvider;
  channelType: ChannelTypeValue;
  externalAccountId: string;
  externalEventId: string;
  eventType: string;
  externalThreadId: string;
  contact: ContactProfile;
  message: {
    externalMessageId: string;
    body: string;
    occurredAt: Date;
    locale?: "EN" | "EL";
  };
  rawPayload: Record<string, unknown>;
};

export type WebhookVerificationInput = {
  headers: Headers;
  payload: Record<string, unknown>;
  query?: URLSearchParams;
  rawBody?: string;
  channelSettings?: Record<string, unknown> | null;
  externalAccountId?: string | null;
};

export type WebhookVerificationResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

export type NormalizeInboundInput = {
  organizationId: string;
  payload: Record<string, unknown>;
  headers: Headers;
  channelSettings?: Record<string, unknown> | null;
  externalAccountId?: string | null;
};

export type OutboundSendInput = {
  organizationId: string;
  channelId: string;
  conversationId: string;
  channelExternalAccountId?: string | null;
  channelSettings?: Record<string, unknown> | null;
  externalThreadId: string;
  body: string;
  idempotencyKey: string;
};

export type OutboundSendResult =
  | {
      ok: true;
      externalMessageId: string;
      sentAt: Date;
      providerResponse?: Record<string, unknown>;
    }
  | {
      ok: false;
      retryable: boolean;
      errorMessage: string;
      providerResponse?: Record<string, unknown>;
    };

export type ChannelAdapter = {
  provider: ChannelProvider;
  channelType: ChannelTypeValue;
  displayName: string;
  configured: boolean;
  verifyWebhook(input: WebhookVerificationInput): WebhookVerificationResult;
  normalizeInbound(input: NormalizeInboundInput): NormalizedInboundEvent;
  normalizeInboundBatch?(input: NormalizeInboundInput): NormalizedInboundEvent[];
  sendMessage(input: OutboundSendInput): Promise<OutboundSendResult>;
};

export class ChannelAdapterNotConfiguredError extends Error {
  constructor(provider: ChannelProvider) {
    super(`${provider} adapter is scaffolded but not configured.`);
    this.name = "ChannelAdapterNotConfiguredError";
  }
}

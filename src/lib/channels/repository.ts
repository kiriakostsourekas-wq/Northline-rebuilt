import type {
  ChannelProvider,
  ChannelTypeValue,
  ConversationStatusValue,
  ContactProfile,
  NormalizedInboundEvent,
} from "@/lib/channels/types";

export type ChannelRecord = {
  id: string;
  type: ChannelTypeValue;
  provider: ChannelProvider;
};

export type ConversationRecord = {
  id: string;
  organizationId: string;
  channelId: string | null;
  externalThreadId: string | null;
};

export type OutboundConversationRecord = ConversationRecord & {
  channelType: ChannelTypeValue | null;
};

export type ChannelRepository = {
  ensureChannel(input: {
    organizationId: string;
    channelType: ChannelTypeValue;
    provider: ChannelProvider;
    externalAccountId: string;
    displayName: string;
  }): Promise<ChannelRecord>;
  beginInboundEvent(
    event: NormalizedInboundEvent,
    channelId: string,
  ): Promise<{ duplicate: true; eventId: string } | { duplicate: false; eventId: string }>;
  markInboundEventProcessed(eventId: string): Promise<void>;
  markInboundEventFailed(eventId: string, errorMessage: string): Promise<void>;
  findLeadIdByExternalIdentity(input: {
    organizationId: string;
    channelType: ChannelTypeValue;
    externalContactId: string;
  }): Promise<string | null>;
  findLeadIdByContact(input: {
    organizationId: string;
    email?: string;
    phone?: string;
  }): Promise<string | null>;
  createLeadFromContact(input: {
    organizationId: string;
    channelId: string;
    contact: ContactProfile;
    locale?: "EN" | "EL";
  }): Promise<string>;
  upsertContactIdentity(input: {
    organizationId: string;
    leadId: string;
    channelId: string;
    channelType: ChannelTypeValue;
    contact: ContactProfile;
  }): Promise<void>;
  findOrCreateConversation(input: {
    organizationId: string;
    leadId: string;
    channelId: string;
    externalThreadId: string;
  }): Promise<ConversationRecord>;
  appendInboundMessage(input: {
    conversationId: string;
    externalMessageId: string;
    body: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
  }): Promise<string>;
  updateConversationAfterInbound(input: {
    conversationId: string;
    body: string;
    at: Date;
  }): Promise<void>;
  getConversationForOutbound(input: {
    organizationId: string;
    conversationId: string;
  }): Promise<OutboundConversationRecord | null>;
  appendOutboundMessage(input: {
    conversationId: string;
    body: string;
    metadata: Record<string, unknown>;
    senderType?: "ASSISTANT" | "HUMAN";
  }): Promise<string>;
  createOutboundAttempt(input: {
    organizationId: string;
    channelId: string | null;
    conversationId: string;
    messageId: string;
    provider: ChannelProvider;
    idempotencyKey: string;
  }): Promise<string>;
  markOutboundAttempt(input: {
    attemptId: string;
    status: "SENT" | "FAILED" | "RETRYING";
    attemptCount: number;
    sentAt?: Date;
    nextAttemptAt?: Date;
    lastError?: string;
  }): Promise<void>;
  markOutboundMessage(input: {
    messageId: string;
    sentAt?: Date;
    failedAt?: Date;
    errorMessage?: string;
  }): Promise<void>;
  updateConversationAfterOutbound(input: {
    conversationId: string;
    body: string;
    at: Date;
    status?: ConversationStatusValue;
  }): Promise<void>;
};

import { randomUUID } from "node:crypto";
import {
  getChannelAdapter,
  getChannelAdapterByType,
} from "@/lib/channels/adapters";
import type { ChannelRepository } from "@/lib/channels/repository";
import type {
  ChannelAdapter,
  ChannelProvider,
  NormalizedInboundEvent,
} from "@/lib/channels/types";
import { safeErrorMessage } from "@/lib/security/logging";

export type IngestionResult =
  | { status: "processed"; conversationId: string; leadId: string; messageId: string }
  | { status: "duplicate"; eventId: string };

export async function ingestInboundEvent(
  repository: ChannelRepository,
  adapter: ChannelAdapter,
  event: NormalizedInboundEvent,
): Promise<IngestionResult> {
  const channel = await repository.ensureChannel({
    organizationId: event.organizationId,
    channelType: event.channelType,
    provider: event.provider,
    externalAccountId: event.externalAccountId,
    displayName: adapter.displayName,
  });
  const eventStart = await repository.beginInboundEvent(event, channel.id);

  if (eventStart.duplicate) {
    console.info("northline.channels.inbound.duplicate", {
      provider: event.provider,
      externalEventId: event.externalEventId,
      eventId: eventStart.eventId,
    });
    return { status: "duplicate", eventId: eventStart.eventId };
  }

  try {
    const identityLeadId = await repository.findLeadIdByExternalIdentity({
      organizationId: event.organizationId,
      channelType: event.channelType,
      externalContactId: event.contact.externalContactId,
    });
    const contactLeadId =
      identityLeadId ??
      (await repository.findLeadIdByContact({
        organizationId: event.organizationId,
        email: event.contact.email,
        phone: event.contact.phone,
      }));
    const leadId =
      contactLeadId ??
      (await repository.createLeadFromContact({
        organizationId: event.organizationId,
        channelId: channel.id,
        contact: event.contact,
        locale: event.message.locale,
      }));

    await repository.upsertContactIdentity({
      organizationId: event.organizationId,
      leadId,
      channelId: channel.id,
      channelType: event.channelType,
      contact: event.contact,
    });

    const conversation = await repository.findOrCreateConversation({
      organizationId: event.organizationId,
      leadId,
      channelId: channel.id,
      externalThreadId: event.externalThreadId,
    });
    const messageId = await repository.appendInboundMessage({
      conversationId: conversation.id,
      externalMessageId: event.message.externalMessageId,
      body: event.message.body,
      createdAt: event.message.occurredAt,
      metadata: {
        provider: event.provider,
        externalEventId: event.externalEventId,
        eventType: event.eventType,
      },
    });

    await repository.updateConversationAfterInbound({
      conversationId: conversation.id,
      body: event.message.body,
      at: event.message.occurredAt,
    });
    await repository.markInboundEventProcessed(eventStart.eventId);

    console.info("northline.channels.inbound.processed", {
      provider: event.provider,
      conversationId: conversation.id,
      leadId,
      messageId,
    });

    return {
      status: "processed",
      conversationId: conversation.id,
      leadId,
      messageId,
    };
  } catch (error) {
    const message = safeErrorMessage(error);
    await repository.markInboundEventFailed(eventStart.eventId, message);
    console.error("northline.channels.inbound.failed", {
      provider: event.provider,
      externalEventId: event.externalEventId,
      error: message,
    });
    throw error;
  }
}

export async function sendOutboundMessage(
  repository: ChannelRepository,
  input: {
    organizationId: string;
    conversationId: string;
    body: string;
    providerOverride?: ChannelProvider;
    senderType?: "ASSISTANT" | "HUMAN";
    statusAfterSend?: "OPEN" | "WAITING_ON_LEAD" | "WAITING_ON_BUSINESS" | "CLOSED";
    metadata?: Record<string, unknown>;
  },
) {
  const conversation = await repository.getConversationForOutbound({
    organizationId: input.organizationId,
    conversationId: input.conversationId,
  });

  if (!conversation) {
    throw new Error("Conversation was not found in this workspace.");
  }

  const channelAdapter = input.providerOverride
    ? getChannelAdapter(input.providerOverride)
    : conversation.channelType
      ? getChannelAdapterByType(conversation.channelType)
      : null;
  const provider = channelAdapter?.provider ?? input.providerOverride ?? "website_chat";
  const messageId = await repository.appendOutboundMessage({
    conversationId: conversation.id,
    body: input.body,
    senderType: input.senderType ?? "HUMAN",
    metadata: { provider, ...(input.metadata ?? {}) },
  });
  const idempotencyKey = `out_${randomUUID()}`;
  const attemptId = await repository.createOutboundAttempt({
    organizationId: input.organizationId,
    channelId: conversation.channelId,
    conversationId: conversation.id,
    messageId,
    provider,
    idempotencyKey,
  });

  if (!channelAdapter || !conversation.channelId || !conversation.externalThreadId) {
    await repository.markOutboundAttempt({
      attemptId,
      status: "FAILED",
      attemptCount: 1,
      lastError: "Conversation is missing a configured channel.",
    });
    await repository.markOutboundMessage({
      messageId,
      failedAt: new Date(),
      errorMessage: "Conversation is missing a configured channel.",
    });
    return { ok: false, messageId, attemptId };
  }

  const sendResult = await channelAdapter.sendMessage({
    organizationId: input.organizationId,
    channelId: conversation.channelId,
    conversationId: conversation.id,
    externalThreadId: conversation.externalThreadId,
    body: input.body,
    idempotencyKey,
  });

  if (sendResult.ok) {
    await repository.markOutboundAttempt({
      attemptId,
      status: "SENT",
      attemptCount: 1,
      sentAt: sendResult.sentAt,
    });
    await repository.markOutboundMessage({
      messageId,
      sentAt: sendResult.sentAt,
    });
    await repository.updateConversationAfterOutbound({
      conversationId: conversation.id,
      body: input.body,
      at: sendResult.sentAt,
      status: input.statusAfterSend ?? "WAITING_ON_LEAD",
    });
    console.info("northline.channels.outbound.sent", {
      provider,
      conversationId: conversation.id,
      messageId,
    });
    return { ok: true, messageId, attemptId };
  }

  const retryAt = sendResult.retryable
    ? new Date(Date.now() + 1000 * 60 * 5)
    : undefined;
  await repository.markOutboundAttempt({
    attemptId,
    status: sendResult.retryable ? "RETRYING" : "FAILED",
    attemptCount: 1,
    nextAttemptAt: retryAt,
    lastError: sendResult.errorMessage,
  });
  await repository.markOutboundMessage({
    messageId,
    failedAt: new Date(),
    errorMessage: sendResult.errorMessage,
  });
  console.error("northline.channels.outbound.failed", {
    provider,
    conversationId: conversation.id,
    messageId,
    retryable: sendResult.retryable,
    error: safeErrorMessage(new Error(sendResult.errorMessage)),
  });

  return { ok: false, messageId, attemptId };
}

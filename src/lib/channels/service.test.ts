import { describe, expect, it } from "vitest";
import { websiteChatAdapter } from "@/lib/channels/adapters/website-chat";
import type { ChannelRepository } from "@/lib/channels/repository";
import { ingestInboundEvent, sendOutboundMessage } from "@/lib/channels/service";
import type { NormalizedInboundEvent } from "@/lib/channels/types";

describe("channel service", () => {
  it("ignores duplicate inbound events before creating messages", async () => {
    const repository = new FakeChannelRepository({ duplicate: true });
    const result = await ingestInboundEvent(
      repository,
      websiteChatAdapter,
      makeEvent(),
    );

    expect(result).toEqual({ status: "duplicate", eventId: "event_existing" });
    expect(repository.messages).toHaveLength(0);
  });

  it("creates a lead, identity, conversation, and inbound message", async () => {
    const repository = new FakeChannelRepository();
    const result = await ingestInboundEvent(
      repository,
      websiteChatAdapter,
      makeEvent(),
    );

    expect(result.status).toBe("processed");
    expect(repository.createdLeadId).toBe("lead_1");
    expect(repository.identityLeadId).toBe("lead_1");
    expect(repository.messages[0]?.body).toBe("I need a demo tomorrow.");
    expect(repository.processedEventIds).toEqual(["event_1"]);
  });

  it("merges contacts by email before creating a new lead", async () => {
    const repository = new FakeChannelRepository({
      contactLeadId: "lead_existing",
    });
    const result = await ingestInboundEvent(
      repository,
      websiteChatAdapter,
      makeEvent(),
    );

    expect(result).toMatchObject({
      status: "processed",
      leadId: "lead_existing",
    });
    expect(repository.createdLeadId).toBeNull();
    expect(repository.identityLeadId).toBe("lead_existing");
  });

  it("sends outbound messages through the conversation channel adapter", async () => {
    const repository = new FakeChannelRepository();
    const result = await sendOutboundMessage(repository, {
      organizationId: "org_1",
      conversationId: "conversation_1",
      body: "Thanks, I can help with that.",
    });

    expect(result.ok).toBe(true);
    expect(repository.outboundMessages[0]?.body).toBe(
      "Thanks, I can help with that.",
    );
    expect(repository.outboundAttempts[0]?.status).toBe("SENT");
    expect(repository.outboundConversationStatus).toBe("WAITING_ON_LEAD");
  });
});

function makeEvent(): NormalizedInboundEvent {
  return {
    organizationId: "org_1",
    provider: "website_chat",
    channelType: "WEBSITE_CHAT",
    externalAccountId: "local-widget",
    externalEventId: "event_1",
    eventType: "message.created",
    externalThreadId: "thread_1",
    contact: {
      externalContactId: "visitor_1",
      displayName: "Maria",
      email: "maria@example.com",
    },
    message: {
      externalMessageId: "message_1",
      body: "I need a demo tomorrow.",
      occurredAt: new Date("2026-04-26T09:00:00.000Z"),
      locale: "EN",
    },
    rawPayload: { source: "test" },
  };
}

class FakeChannelRepository implements ChannelRepository {
  messages: Array<{ id: string; body: string }> = [];
  outboundMessages: Array<{ id: string; body: string }> = [];
  outboundAttempts: Array<{ id: string; status?: string }> = [];
  processedEventIds: string[] = [];
  createdLeadId: string | null = null;
  identityLeadId: string | null = null;
  outboundConversationStatus: string | null = null;

  constructor(
    private readonly options: {
      duplicate?: boolean;
      identityLeadId?: string;
      contactLeadId?: string;
    } = {},
  ) {}

  async ensureChannel() {
    return {
      id: "channel_1",
      type: "WEBSITE_CHAT" as const,
      provider: "website_chat" as const,
    };
  }

  async beginInboundEvent() {
    if (this.options.duplicate) {
      return { duplicate: true as const, eventId: "event_existing" };
    }
    return { duplicate: false as const, eventId: "event_1" };
  }

  async markInboundEventProcessed(eventId: string) {
    this.processedEventIds.push(eventId);
  }

  async markInboundEventFailed() {}

  async findLeadIdByExternalIdentity() {
    return this.options.identityLeadId ?? null;
  }

  async findLeadIdByContact() {
    return this.options.contactLeadId ?? null;
  }

  async createLeadFromContact() {
    this.createdLeadId = "lead_1";
    return "lead_1";
  }

  async upsertContactIdentity(input: { leadId: string }) {
    this.identityLeadId = input.leadId;
  }

  async findOrCreateConversation() {
    return {
      id: "conversation_1",
      organizationId: "org_1",
      channelId: "channel_1",
      externalThreadId: "thread_1",
    };
  }

  async appendInboundMessage(input: { body: string }) {
    this.messages.push({ id: "message_1", body: input.body });
    return "message_1";
  }

  async updateConversationAfterInbound() {}

  async getConversationForOutbound() {
    return {
      id: "conversation_1",
      organizationId: "org_1",
      channelId: "channel_1",
      externalThreadId: "thread_1",
      channelType: "WEBSITE_CHAT" as const,
    };
  }

  async appendOutboundMessage(input: { body: string }) {
    this.outboundMessages.push({ id: "message_out_1", body: input.body });
    return "message_out_1";
  }

  async createOutboundAttempt() {
    this.outboundAttempts.push({ id: "attempt_1" });
    return "attempt_1";
  }

  async markOutboundAttempt(input: { status: string }) {
    this.outboundAttempts[0] = {
      id: "attempt_1",
      status: input.status,
    };
  }

  async markOutboundMessage() {}

  async updateConversationAfterOutbound(input: { status?: string }) {
    this.outboundConversationStatus = input.status ?? null;
  }
}

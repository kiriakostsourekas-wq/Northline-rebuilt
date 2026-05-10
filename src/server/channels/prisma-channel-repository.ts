import { Prisma } from "@/generated/prisma/client";
import type { ChannelRepository } from "@/lib/channels/repository";
import type { ContactProfile } from "@/lib/channels/types";
import { analyzeText } from "@/lib/language";
import { getPrismaClient } from "@/server/db";

export function createPrismaChannelRepository(
  prisma = getPrismaClient(),
): ChannelRepository {
  return {
    async ensureChannel(input) {
      const existing = await prisma.channel.findFirst({
        where: {
          organizationId: input.organizationId,
          type: input.channelType,
          externalAccountId: input.externalAccountId,
        },
      });

      const channel =
        existing ??
        (await prisma.channel.create({
          data: {
            organizationId: input.organizationId,
            type: input.channelType,
            displayName: input.displayName,
            externalAccountId: input.externalAccountId,
            status: "ACTIVE",
            settings: {
              provider: input.provider,
              mode: input.provider === "website_chat" ? "local" : "scaffolded",
            },
          },
        }));

      return {
        id: channel.id,
        type: channel.type,
        provider: input.provider,
      };
    },

    async beginInboundEvent(event, channelId) {
      const existing = await prisma.channelEvent.findUnique({
        where: {
          organizationId_provider_externalEventId: {
            organizationId: event.organizationId,
            provider: event.provider,
            externalEventId: event.externalEventId,
          },
        },
      });

      if (existing) {
        if (existing.status === "FAILED" && existing.attemptCount < 3) {
          const retryEvent = await prisma.channelEvent.update({
            where: { id: existing.id },
            data: {
              status: "RECEIVED",
              attemptCount: { increment: 1 },
              lastError: null,
            },
          });
          return { duplicate: false, eventId: retryEvent.id };
        }

        return { duplicate: true, eventId: existing.id };
      }

      const created = await prisma.channelEvent.create({
        data: {
          organizationId: event.organizationId,
          channelId,
          provider: event.provider,
          externalEventId: event.externalEventId,
          eventType: event.eventType,
          payload: toJson(event.rawPayload),
          attemptCount: 1,
        },
      });

      return { duplicate: false, eventId: created.id };
    },

    async markInboundEventProcessed(eventId) {
      await prisma.channelEvent.update({
        where: { id: eventId },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          lastError: null,
        },
      });
    },

    async markInboundEventFailed(eventId, errorMessage) {
      await prisma.channelEvent.update({
        where: { id: eventId },
        data: {
          status: "FAILED",
          lastError: errorMessage,
        },
      });
    },

    async findLeadIdByExternalIdentity(input) {
      const identity = await prisma.contactIdentity.findUnique({
        where: {
          organizationId_channelType_externalContactId: {
            organizationId: input.organizationId,
            channelType: input.channelType,
            externalContactId: input.externalContactId,
          },
        },
        select: { leadId: true },
      });

      return identity?.leadId ?? null;
    },

    async findLeadIdByContact(input) {
      const filters = [
        input.email ? { email: input.email.toLowerCase() } : null,
        input.phone ? { phone: input.phone } : null,
      ].filter(Boolean);

      if (filters.length === 0) return null;

      const lead = await prisma.lead.findFirst({
        where: {
          organizationId: input.organizationId,
          OR: filters as Prisma.LeadWhereInput[],
        },
        select: { id: true },
      });

      return lead?.id ?? null;
    },

    async createLeadFromContact(input) {
      const lead = await prisma.lead.create({
        data: {
          organizationId: input.organizationId,
          sourceChannelId: input.channelId,
          fullName: input.contact.displayName,
          email: input.contact.email?.toLowerCase(),
          phone: input.contact.phone,
          preferredLocale: input.locale,
          status: "QUALIFYING",
          summary: buildLeadSummary(input.contact),
        },
      });

      return lead.id;
    },

    async upsertContactIdentity(input) {
      await prisma.contactIdentity.upsert({
        where: {
          organizationId_channelType_externalContactId: {
            organizationId: input.organizationId,
            channelType: input.channelType,
            externalContactId: input.contact.externalContactId,
          },
        },
        create: {
          organizationId: input.organizationId,
          leadId: input.leadId,
          channelId: input.channelId,
          channelType: input.channelType,
          externalContactId: input.contact.externalContactId,
          displayName: input.contact.displayName,
          email: input.contact.email?.toLowerCase(),
          phone: input.contact.phone,
          handle: input.contact.handle,
          confidence: input.contact.email || input.contact.phone ? 95 : 75,
        },
        update: {
          leadId: input.leadId,
          channelId: input.channelId,
          displayName: input.contact.displayName,
          email: input.contact.email?.toLowerCase(),
          phone: input.contact.phone,
          handle: input.contact.handle,
          confidence: input.contact.email || input.contact.phone ? 95 : 75,
        },
      });
    },

    async findOrCreateConversation(input) {
      const existing = await prisma.conversation.findUnique({
        where: {
          organizationId_channelId_externalThreadId: {
            organizationId: input.organizationId,
            channelId: input.channelId,
            externalThreadId: input.externalThreadId,
          },
        },
      });

      const conversation =
        existing ??
        (await prisma.conversation.create({
          data: {
            organizationId: input.organizationId,
            leadId: input.leadId,
            channelId: input.channelId,
            externalThreadId: input.externalThreadId,
            status: "OPEN",
          },
        }));

      return {
        id: conversation.id,
        organizationId: conversation.organizationId,
        channelId: conversation.channelId,
        externalThreadId: conversation.externalThreadId,
      };
    },

    async appendInboundMessage(input) {
      const existing = await prisma.message.findUnique({
        where: {
          conversationId_externalMessageId: {
            conversationId: input.conversationId,
            externalMessageId: input.externalMessageId,
          },
        },
        select: { id: true },
      });

      if (existing) return existing.id;
      const text = analyzeText(input.body);

      const message = await prisma.message.create({
        data: {
          conversationId: input.conversationId,
          externalMessageId: input.externalMessageId,
          direction: "INBOUND",
          senderType: "LEAD",
          body: text.displayText,
          rawBody: text.rawText,
          displayBody: text.displayText,
          normalizedBody: text.normalizedText,
          searchBody: text.searchText,
          detectedLanguage: text.detection.language,
          languageConfidence: Math.round(text.detection.confidence * 100),
          languageMetadata: toJson({
            greekCharacters: text.detection.greekCharacters,
            latinCharacters: text.detection.latinCharacters,
            greeklishSignals: text.detection.greeklishSignals,
            englishSignals: text.detection.englishSignals,
            greeklishText: text.greeklishText,
          }),
          metadata: toJson({
            ...input.metadata,
            language: text.detection.language,
          }),
          createdAt: input.createdAt,
        },
      });

      return message.id;
    },

    async updateConversationAfterInbound(input) {
      const text = analyzeText(input.body);
      await prisma.conversation.update({
        where: { id: input.conversationId },
        data: {
          status: "OPEN",
          lastMessageAt: input.at,
          lastInboundAt: input.at,
          lastMessagePreview: truncatePreview(text.displayText),
        },
      });
    },

    async getConversationForOutbound(input) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: input.conversationId,
          organizationId: input.organizationId,
        },
        include: { channel: true },
      });

      if (!conversation) return null;

      return {
        id: conversation.id,
        organizationId: conversation.organizationId,
        channelId: conversation.channelId,
        externalThreadId: conversation.externalThreadId,
        channelType: conversation.channel?.type ?? null,
        channelExternalAccountId: conversation.channel?.externalAccountId ?? null,
        channelSettings: toObject(conversation.channel?.settings),
      };
    },

    async appendOutboundMessage(input) {
      const text = analyzeText(input.body);
      const message = await prisma.message.create({
        data: {
          conversationId: input.conversationId,
          direction: "OUTBOUND",
          senderType: input.senderType ?? "HUMAN",
          body: text.displayText,
          rawBody: text.rawText,
          displayBody: text.displayText,
          normalizedBody: text.normalizedText,
          searchBody: text.searchText,
          detectedLanguage: text.detection.language,
          languageConfidence: Math.round(text.detection.confidence * 100),
          languageMetadata: toJson({
            greekCharacters: text.detection.greekCharacters,
            latinCharacters: text.detection.latinCharacters,
            greeklishSignals: text.detection.greeklishSignals,
            englishSignals: text.detection.englishSignals,
            greeklishText: text.greeklishText,
          }),
          metadata: toJson({
            ...input.metadata,
            language: text.detection.language,
          }),
        },
      });

      return message.id;
    },

    async createOutboundAttempt(input) {
      const attempt = await prisma.outboundMessageAttempt.create({
        data: {
          organizationId: input.organizationId,
          channelId: input.channelId,
          conversationId: input.conversationId,
          messageId: input.messageId,
          provider: input.provider,
          idempotencyKey: input.idempotencyKey,
          status: "QUEUED",
        },
      });

      return attempt.id;
    },

    async markOutboundAttempt(input) {
      await prisma.outboundMessageAttempt.update({
        where: { id: input.attemptId },
        data: {
          status: input.status,
          attemptCount: input.attemptCount,
          sentAt: input.sentAt,
          nextAttemptAt: input.nextAttemptAt,
          lastError: input.lastError,
        },
      });
    },

    async markOutboundMessage(input) {
      await prisma.message.update({
        where: { id: input.messageId },
        data: {
          sentAt: input.sentAt,
          failedAt: input.failedAt,
          errorMessage: input.errorMessage,
        },
      });
    },

    async updateConversationAfterOutbound(input) {
      const text = analyzeText(input.body);
      await prisma.conversation.update({
        where: { id: input.conversationId },
        data: {
          status: input.status,
          lastMessageAt: input.at,
          lastOutboundAt: input.at,
          lastMessagePreview: truncatePreview(text.displayText),
        },
      });
    },
  };
}

function buildLeadSummary(contact: ContactProfile) {
  const parts = [
    contact.displayName ? `Name: ${contact.displayName}` : null,
    contact.email ? `Email: ${contact.email}` : null,
    contact.phone ? `Phone: ${contact.phone}` : null,
    contact.handle ? `Handle: ${contact.handle}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : "Lead created from inbound channel.";
}

function truncatePreview(body: string) {
  return body.length > 140 ? `${body.slice(0, 137)}...` : body;
}

function toJson(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

function toObject(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

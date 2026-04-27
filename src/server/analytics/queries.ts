import { Prisma, type ChannelType } from "@/generated/prisma/client";
import { buildOperationalAnalytics } from "@/lib/analytics/aggregation";
import type {
  AnalyticsDateRange,
  AnalyticsReport,
} from "@/lib/analytics/types";
import { getPrismaClient } from "@/server/db";

export type AnalyticsChannelFilter = ChannelType | "ALL";

export type AnalyticsPageData = {
  report: AnalyticsReport;
  channels: Array<{ id: string; type: string; displayName: string }>;
};

export async function getAnalyticsPageData(input: {
  organizationId: string;
  dateRange: AnalyticsDateRange;
  channel: AnalyticsChannelFilter;
}): Promise<AnalyticsPageData> {
  const prisma = getPrismaClient();
  const channelType = input.channel === "ALL" ? null : input.channel;
  const conversationWhere: Prisma.ConversationWhereInput = {
    organizationId: input.organizationId,
    createdAt: {
      gte: input.dateRange.from,
      lte: input.dateRange.to,
    },
    ...(channelType ? { channel: { type: channelType } } : {}),
  };
  const bookingWhere: Prisma.BookingRequestWhereInput = {
    organizationId: input.organizationId,
    createdAt: {
      gte: input.dateRange.from,
      lte: input.dateRange.to,
    },
    ...(channelType
      ? {
          conversation: {
            channel: { type: channelType },
          },
        }
      : {}),
  };

  const [
    conversations,
    bookings,
    leadExports,
    deliveryAttempts,
    channels,
  ] = await Promise.all([
    prisma.conversation.findMany({
      where: conversationWhere,
      select: {
        id: true,
        status: true,
        createdAt: true,
        lastInboundAt: true,
        lastOutboundAt: true,
        channel: {
          select: {
            type: true,
            displayName: true,
          },
        },
        lead: {
          select: {
            id: true,
            status: true,
            score: true,
          },
        },
        messages: {
          where: {
            createdAt: {
              gte: input.dateRange.from,
              lte: input.dateRange.to,
            },
          },
          select: {
            id: true,
            direction: true,
            senderType: true,
            detectedLanguage: true,
            createdAt: true,
            sentAt: true,
            failedAt: true,
            errorMessage: true,
          },
          orderBy: { createdAt: "asc" },
        },
        handoffs: {
          select: {
            id: true,
            status: true,
            reason: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        handoffEvents: {
          where: {
            createdAt: {
              gte: input.dateRange.from,
              lte: input.dateRange.to,
            },
          },
          select: {
            id: true,
            eventType: true,
            reason: true,
            note: true,
            createdAt: true,
            actorUserId: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 500,
    }),
    prisma.bookingRequest.findMany({
      where: bookingWhere,
      select: {
        id: true,
        status: true,
        createdAt: true,
        confirmedAt: true,
        conversationId: true,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 500,
    }),
    prisma.leadExport.findMany({
      where: {
        organizationId: input.organizationId,
        createdAt: {
          gte: input.dateRange.from,
          lte: input.dateRange.to,
        },
      },
      select: {
        id: true,
        status: true,
        eventType: true,
        createdAt: true,
        deliveredAt: true,
        lastError: true,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 500,
    }),
    prisma.exportDeliveryAttempt.findMany({
      where: {
        organizationId: input.organizationId,
        createdAt: {
          gte: input.dateRange.from,
          lte: input.dateRange.to,
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        errorMessage: true,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 500,
    }),
    prisma.channel.findMany({
      where: { organizationId: input.organizationId },
      select: { id: true, type: true, displayName: true },
      orderBy: [{ type: "asc" }, { displayName: "asc" }],
    }),
  ]);

  return {
    channels,
    report: buildOperationalAnalytics({
      dateRange: input.dateRange,
      conversations: conversations.map((conversation) => ({
        id: conversation.id,
        status: conversation.status,
        createdAt: conversation.createdAt,
        lastInboundAt: conversation.lastInboundAt,
        lastOutboundAt: conversation.lastOutboundAt,
        channelType: conversation.channel?.type ?? null,
        channelDisplayName: conversation.channel?.displayName ?? null,
        leadId: conversation.lead?.id ?? null,
        leadStatus: conversation.lead?.status ?? null,
        leadScore: conversation.lead?.score ?? null,
        messages: conversation.messages,
        handoffs: conversation.handoffs,
        handoffEvents: conversation.handoffEvents,
      })),
      bookings,
      exports: leadExports,
      deliveryAttempts,
    }),
  };
}

export function parseAnalyticsChannel(value?: string | string[] | null) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || raw === "ALL") return "ALL";
  return channelTypes.has(raw as ChannelType) ? (raw as ChannelType) : "ALL";
}

export function parseAnalyticsRange(input: {
  range?: string | string[] | null;
  from?: string | string[] | null;
  to?: string | string[] | null;
  now?: Date;
}): AnalyticsDateRange & { preset: string } {
  const now = input.now ?? new Date();
  const range = normalizeParam(input.range) ?? "30d";
  const customFrom = parseDate(normalizeParam(input.from));
  const customTo = parseDate(normalizeParam(input.to));

  if (range === "custom" && customFrom && customTo) {
    return {
      from: startOfDay(customFrom),
      to: endOfDay(customTo),
      preset: "custom",
    };
  }

  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  return {
    from: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
    to: now,
    preset: `${days}d`,
  };
}

function normalizeParam(value?: string | string[] | null) {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function endOfDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

const channelTypes = new Set<ChannelType>([
  "WEBSITE_CHAT",
  "WHATSAPP",
  "INSTAGRAM",
  "FACEBOOK_MESSENGER",
  "TELEGRAM",
  "VIBER",
  "EMAIL",
  "API",
]);

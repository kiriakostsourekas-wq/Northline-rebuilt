import { getPrismaClient } from "@/server/db";
import type { ConversationStatusValue } from "@/lib/channels/types";
import { analyzeText } from "@/lib/language";

export type InboxStatusFilter =
  | "ALL"
  | "OPEN"
  | "WAITING_ON_LEAD"
  | "WAITING_ON_BUSINESS"
  | "CLOSED";

export type InboxConversationListItem = {
  id: string;
  status: string;
  aiResponderState: string;
  handoffRequestedAt: Date | null;
  activeHandoffStatus: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: Date | null;
  channel: { id: string; type: string; displayName: string } | null;
  lead: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  assignedUser: { id: string; name: string | null; email: string } | null;
  messageCount: number;
};

export type InboxConversationDetail = {
  id: string;
  status: string;
  aiResponderState: string;
  aiPausedAt: Date | null;
  aiResumedAt: Date | null;
  aiPauseReason: string | null;
  handoffRequestedAt: Date | null;
  summary: string | null;
  internalNotes: string | null;
  lastMessagePreview: string | null;
  externalThreadId: string | null;
  channel: { id: string; type: string; displayName: string } | null;
  lead: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    preferredContactMethod: string | null;
    serviceInterest: string | null;
    budget: string | null;
    location: string | null;
    urgency: string | null;
    bookingIntent: boolean;
    status: string;
    score: number;
    qualificationConfidence: number;
    contactIdentities: Array<{
      id: string;
      channelType: string;
      externalContactId: string;
      displayName: string | null;
      email: string | null;
      phone: string | null;
      handle: string | null;
    }>;
  } | null;
  assignedUser: { id: string; name: string | null; email: string } | null;
  handoffs: Array<{
    id: string;
    reason: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    assignedUser: { id: string; name: string | null; email: string } | null;
  }>;
  handoffEvents: Array<{
    id: string;
    eventType: string;
    reason: string | null;
    note: string | null;
    createdAt: Date;
    actorUser: { id: string; name: string | null; email: string } | null;
  }>;
  messages: Array<{
    id: string;
    direction: string;
    senderType: string;
    body: string;
    displayBody: string | null;
    rawBody: string | null;
    normalizedBody: string | null;
    detectedLanguage: string;
    languageConfidence: number;
    createdAt: Date;
    errorMessage: string | null;
  }>;
};

export type InboxOperator = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

const validStatuses = new Set<ConversationStatusValue>([
  "OPEN",
  "WAITING_ON_LEAD",
  "WAITING_ON_BUSINESS",
  "CLOSED",
]);

export async function getInboxConversations(input: {
  organizationId: string;
  status?: string;
  query?: string;
}) {
  const prisma = getPrismaClient();
  const query = input.query?.trim();
  const normalizedQuery = query ? analyzeText(query).searchText : null;
  const status = parseStatus(input.status);
  const searchConditions = query
    ? [
        { lastMessagePreview: { contains: query, mode: "insensitive" as const } },
        { lead: { fullName: { contains: query, mode: "insensitive" as const } } },
        { lead: { email: { contains: query, mode: "insensitive" as const } } },
        { lead: { phone: { contains: query, mode: "insensitive" as const } } },
        ...(normalizedQuery
          ? [
              {
                messages: {
                  some: {
                    searchBody: {
                      contains: normalizedQuery,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ]
          : []),
      ]
    : [];

  const conversations = await prisma.conversation.findMany({
    where: {
      organizationId: input.organizationId,
      ...(status ? { status } : {}),
      ...(searchConditions.length ? { OR: searchConditions } : {}),
    },
    include: {
      channel: {
        select: { id: true, type: true, displayName: true },
      },
      lead: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      assignedUser: {
        select: { id: true, name: true, email: true },
      },
      handoffs: {
        where: { status: { in: ["REQUESTED", "ACCEPTED"] } },
        select: { status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { messages: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return conversations.map((conversation) => ({
    id: conversation.id,
    status: conversation.status,
    aiResponderState: conversation.aiResponderState,
    handoffRequestedAt: conversation.handoffRequestedAt,
    activeHandoffStatus: conversation.handoffs[0]?.status ?? null,
    lastMessagePreview:
      conversation.lastMessagePreview ?? conversation.messages[0]?.body ?? null,
    lastMessageAt: conversation.lastMessageAt,
    channel: conversation.channel,
    lead: conversation.lead,
    assignedUser: conversation.assignedUser,
    messageCount: conversation._count.messages,
  }));
}

export async function getInboxConversationDetail(input: {
  organizationId: string;
  conversationId: string;
}) {
  const prisma = getPrismaClient();

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      organizationId: input.organizationId,
    },
    include: {
      channel: {
        select: { id: true, type: true, displayName: true },
      },
      lead: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          preferredContactMethod: true,
          serviceInterest: true,
          budget: true,
          location: true,
          urgency: true,
          bookingIntent: true,
          status: true,
          score: true,
          qualificationConfidence: true,
          contactIdentities: {
            select: {
              id: true,
              channelType: true,
              externalContactId: true,
              displayName: true,
              email: true,
              phone: true,
              handle: true,
            },
            orderBy: { lastSeenAt: "desc" },
          },
        },
      },
      assignedUser: {
        select: { id: true, name: true, email: true },
      },
      handoffs: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          assignedUser: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      handoffEvents: {
        orderBy: { createdAt: "asc" },
        take: 120,
        select: {
          id: true,
          eventType: true,
          reason: true,
          note: true,
          createdAt: true,
          actorUser: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      messages: {
        select: {
          id: true,
          direction: true,
          senderType: true,
          body: true,
          displayBody: true,
          rawBody: true,
          normalizedBody: true,
          detectedLanguage: true,
          languageConfidence: true,
          createdAt: true,
          errorMessage: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) return null;

  return {
    id: conversation.id,
    status: conversation.status,
    aiResponderState: conversation.aiResponderState,
    aiPausedAt: conversation.aiPausedAt,
    aiResumedAt: conversation.aiResumedAt,
    aiPauseReason: conversation.aiPauseReason,
    handoffRequestedAt: conversation.handoffRequestedAt,
    summary: conversation.summary,
    internalNotes: conversation.internalNotes,
    lastMessagePreview: conversation.lastMessagePreview,
    externalThreadId: conversation.externalThreadId,
    channel: conversation.channel,
    lead: conversation.lead,
    assignedUser: conversation.assignedUser,
    handoffs: conversation.handoffs,
    handoffEvents: conversation.handoffEvents,
    messages: conversation.messages,
  };
}

export async function getInboxOperators(input: { organizationId: string }) {
  const prisma = getPrismaClient();

  return prisma.user.findMany({
    where: { organizationId: input.organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });
}

function parseStatus(value?: string): ConversationStatusValue | undefined {
  return value && validStatuses.has(value as ConversationStatusValue)
    ? (value as ConversationStatusValue)
    : undefined;
}

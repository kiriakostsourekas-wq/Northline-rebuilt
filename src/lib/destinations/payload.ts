import { createHash } from "node:crypto";
import type { DestinationEventType, ExportPayload } from "@/lib/destinations/types";

export type LeadExportPayloadInput = {
  eventType: DestinationEventType;
  idempotencyKey: string;
  exportedAt?: Date;
  includeRawConversation?: boolean;
  workspace: {
    id: string;
    name: string;
    slug: string;
    defaultLocale: "EN" | "EL";
    languageMode: string;
    primaryMarket: string;
    planTier: string;
  };
  lead: {
    id: string;
    status: string;
    score: number;
    qualificationConfidence: number;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    preferredContactMethod: string | null;
    serviceInterest: string | null;
    budget: string | null;
    location: string | null;
    urgency: string | null;
    bookingIntent: boolean;
    preferredLocale: "EN" | "EL" | null;
    summary: string | null;
    qualificationData: unknown;
    createdAt: Date;
    updatedAt: Date;
    sourceChannel: {
      id: string;
      type: string;
      displayName: string;
    } | null;
    contactIdentities: Array<{
      channelType: string;
      externalContactId: string;
      displayName: string | null;
      email: string | null;
      phone: string | null;
      handle: string | null;
      confidence: number;
    }>;
  };
  conversation?: {
    id: string;
    status: string;
    summary: string | null;
    internalNotes: string | null;
    lastMessageAt: Date | null;
    lastInboundAt: Date | null;
    lastOutboundAt: Date | null;
    externalThreadId: string | null;
    engineState: unknown;
    channel: {
      id: string;
      type: string;
      displayName: string;
    } | null;
    messages?: Array<{
      direction: string;
      senderType: string;
      displayBody: string | null;
      body: string;
      detectedLanguage: string;
      createdAt: Date;
    }>;
  } | null;
  booking?: {
    id: string;
    status: string;
    startsAt: Date | null;
    endsAt: Date | null;
    timezone: string;
    provider: string;
    externalEventId: string | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    summary: string | null;
    confirmedAt: Date | null;
    meetingType: { name: string } | null;
  } | null;
};

export function buildLeadExportPayload(
  input: LeadExportPayloadInput,
): ExportPayload {
  const exportedAt = input.exportedAt ?? new Date();
  const sourceChannel = input.lead.sourceChannel ?? input.conversation?.channel ?? null;

  return {
    version: "northline.lead_export.v1",
    event: {
      type: input.eventType,
      idempotencyKey: input.idempotencyKey,
      exportedAt: exportedAt.toISOString(),
    },
    workspace: input.workspace,
    lead: {
      id: input.lead.id,
      status: input.lead.status,
      score: input.lead.score,
      qualificationConfidence: input.lead.qualificationConfidence,
      fullName: input.lead.fullName,
      email: input.lead.email,
      phone: input.lead.phone,
      preferredContactMethod: input.lead.preferredContactMethod,
      serviceInterest: input.lead.serviceInterest,
      budget: input.lead.budget,
      location: input.lead.location,
      urgency: input.lead.urgency,
      bookingIntent: input.lead.bookingIntent,
      preferredLocale: input.lead.preferredLocale,
      summary: input.lead.summary,
      qualificationData: toObject(input.lead.qualificationData),
      createdAt: input.lead.createdAt.toISOString(),
      updatedAt: input.lead.updatedAt.toISOString(),
    },
    contactIdentities: input.lead.contactIdentities,
    sourceChannel,
    conversation: input.conversation
      ? {
          id: input.conversation.id,
          status: input.conversation.status,
          summary: input.conversation.summary,
          internalNotes: input.conversation.internalNotes,
          lastMessageAt: input.conversation.lastMessageAt?.toISOString() ?? null,
          lastInboundAt: input.conversation.lastInboundAt?.toISOString() ?? null,
          lastOutboundAt: input.conversation.lastOutboundAt?.toISOString() ?? null,
          externalThreadId: input.conversation.externalThreadId,
          metadata: toObject(input.conversation.engineState),
          messages: input.includeRawConversation
            ? input.conversation.messages?.map((message) => ({
                direction: message.direction,
                senderType: message.senderType,
                body: message.displayBody ?? message.body,
                detectedLanguage: message.detectedLanguage,
                createdAt: message.createdAt.toISOString(),
              }))
            : undefined,
        }
      : null,
    booking: input.booking
      ? {
          id: input.booking.id,
          status: input.booking.status,
          startsAt: input.booking.startsAt?.toISOString() ?? null,
          endsAt: input.booking.endsAt?.toISOString() ?? null,
          timezone: input.booking.timezone,
          meetingTypeName: input.booking.meetingType?.name ?? null,
          provider: input.booking.provider,
          externalEventId: input.booking.externalEventId,
          customerName: input.booking.customerName,
          customerEmail: input.booking.customerEmail,
          customerPhone: input.booking.customerPhone,
          summary: input.booking.summary,
          confirmedAt: input.booking.confirmedAt?.toISOString() ?? null,
        }
      : null,
    timestamps: {
      exportedAt: exportedAt.toISOString(),
      leadCreatedAt: input.lead.createdAt.toISOString(),
      leadUpdatedAt: input.lead.updatedAt.toISOString(),
    },
  };
}

export function buildExportIdempotencyKey(input: {
  organizationId: string;
  leadId: string;
  eventType: DestinationEventType;
  conversationId?: string | null;
  bookingRequestId?: string | null;
}) {
  return [
    "northline",
    "lead-export",
    input.organizationId,
    input.eventType,
    input.leadId,
    input.bookingRequestId ?? input.conversationId ?? "lead",
  ].join(":");
}

export function hashPayload(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

function toObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

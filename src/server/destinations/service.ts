import { Prisma } from "@/generated/prisma/client";
import {
  buildExportIdempotencyKey,
  buildLeadExportPayload,
  getCrmAdapter,
  hashPayload,
  nextRetryAt,
  shouldRetry,
  type DestinationEventType,
  type DestinationSnapshot,
  type ExportPayload,
} from "@/lib/destinations";
import { getPrismaClient } from "@/server/db";

export async function triggerLeadExport(input: {
  organizationId: string;
  leadId: string;
  conversationId?: string | null;
  bookingRequestId?: string | null;
  eventType: DestinationEventType;
}) {
  const prisma = getPrismaClient();
  const destinations = await prisma.outboundDestination.findMany({
    where: {
      organizationId: input.organizationId,
      status: "ACTIVE",
      eventTypes: { has: input.eventType },
    },
    orderBy: { createdAt: "asc" },
  });

  if (destinations.length === 0) {
    console.info("northline.export.skipped_no_destinations", {
      organizationId: input.organizationId,
      leadId: input.leadId,
      eventType: input.eventType,
    });
    return null;
  }

  const payloadInput = await getLeadExportPayloadInput({
    ...input,
    includeRawConversation: destinations.some(
      (destination) => destination.includeRawConversation,
    ),
  });
  const payload = buildLeadExportPayload(payloadInput);
  const payloadHash = hashPayload(payload);
  const leadExport = await prisma.leadExport.upsert({
    where: { idempotencyKey: payload.event.idempotencyKey },
    create: {
      organizationId: input.organizationId,
      leadId: input.leadId,
      conversationId: input.conversationId,
      bookingRequestId: input.bookingRequestId,
      eventType: input.eventType,
      payload: toJson(payload),
      payloadHash,
      idempotencyKey: payload.event.idempotencyKey,
      status: "PENDING",
    },
    update: {
      payload: toJson(payload),
      payloadHash,
      status: "PENDING",
      lastError: null,
    },
  });

  const attempts = [];
  for (const destination of destinations) {
    attempts.push(
      await deliverExportToDestination({
        organizationId: input.organizationId,
        exportId: leadExport.id,
        destinationId: destination.id,
      }),
    );
  }

  return {
    exportId: leadExport.id,
    attempts,
  };
}

export async function replayExportDelivery(input: {
  organizationId: string;
  exportId: string;
  destinationId: string;
}) {
  return deliverExportToDestination({
    organizationId: input.organizationId,
    exportId: input.exportId,
    destinationId: input.destinationId,
    force: true,
  });
}

export async function deliverDueExportAttempts(input: {
  organizationId: string;
  now?: Date;
  limit?: number;
}) {
  const prisma = getPrismaClient();
  const now = input.now ?? new Date();
  const due = await prisma.exportDeliveryAttempt.findMany({
    where: {
      organizationId: input.organizationId,
      status: "RETRYING",
      nextAttemptAt: { lte: now },
    },
    select: { exportId: true, destinationId: true },
    distinct: ["exportId", "destinationId"],
    take: input.limit ?? 20,
  });

  const results = [];
  for (const item of due) {
    results.push(
      await replayExportDelivery({
        organizationId: input.organizationId,
        exportId: item.exportId,
        destinationId: item.destinationId,
      }),
    );
  }
  return results;
}

async function deliverExportToDestination(input: {
  organizationId: string;
  exportId: string;
  destinationId: string;
  force?: boolean;
}) {
  const prisma = getPrismaClient();
  const [leadExport, destination, previousAttempts] = await Promise.all([
    prisma.leadExport.findFirst({
      where: {
        id: input.exportId,
        organizationId: input.organizationId,
      },
    }),
    prisma.outboundDestination.findFirst({
      where: {
        id: input.destinationId,
        organizationId: input.organizationId,
      },
    }),
    prisma.exportDeliveryAttempt.findMany({
      where: {
        exportId: input.exportId,
        destinationId: input.destinationId,
      },
      orderBy: { attemptNumber: "desc" },
      take: 1,
    }),
  ]);

  if (!leadExport || !destination) {
    throw new Error("Export or destination not found.");
  }

  const latestAttempt = previousAttempts[0];
  if (!input.force && latestAttempt?.status === "DELIVERED") {
    return latestAttempt;
  }

  const attemptNumber = (latestAttempt?.attemptNumber ?? 0) + 1;
  const destinationSnapshot = mapDestination(destination);
  const payload = fromJsonPayload(leadExport.payload);
  const adapter = getCrmAdapter(destination.provider);
  const delivery = await adapter.deliver({
    destination: destinationSnapshot,
    payload,
    exportId: leadExport.id,
    idempotencyKey: `${leadExport.idempotencyKey}:${destination.id}`,
  });
  const retry = shouldRetry({
    retryable: delivery.retryable,
    attemptNumber,
    maxAttempts: destination.maxAttempts,
  });
  const finalStatus = delivery.status === "DELIVERED" ? "DELIVERED" : retry ? "RETRYING" : "FAILED";
  const attempt = await prisma.exportDeliveryAttempt.create({
    data: {
      organizationId: input.organizationId,
      exportId: leadExport.id,
      destinationId: destination.id,
      status: finalStatus,
      attemptNumber,
      idempotencyKey: `${leadExport.id}:${destination.id}:${attemptNumber}`,
      requestPayloadHash: leadExport.payloadHash,
      responseStatus: delivery.responseStatus,
      responseBody: delivery.responseBody,
      errorMessage: delivery.errorMessage,
      nextAttemptAt: retry ? nextRetryAt({ attemptNumber }) : null,
      deliveredAt: finalStatus === "DELIVERED" ? new Date() : null,
    },
  });

  await refreshExportStatus({
    organizationId: input.organizationId,
    exportId: leadExport.id,
  });

  console.info("northline.export.delivery_attempt", {
    exportId: leadExport.id,
    destinationId: destination.id,
    status: finalStatus,
    attemptNumber,
  });

  return attempt;
}

async function refreshExportStatus(input: {
  organizationId: string;
  exportId: string;
}) {
  const prisma = getPrismaClient();
  const attempts = await prisma.exportDeliveryAttempt.findMany({
    where: {
      organizationId: input.organizationId,
      exportId: input.exportId,
    },
    select: { status: true, errorMessage: true, deliveredAt: true },
  });
  const deliveredCount = attempts.filter(
    (attempt) => attempt.status === "DELIVERED",
  ).length;
  const failedCount = attempts.filter((attempt) => attempt.status === "FAILED")
    .length;
  const retryingCount = attempts.filter(
    (attempt) => attempt.status === "RETRYING",
  ).length;
  const status =
    attempts.length > 0 && deliveredCount === attempts.length
      ? "DELIVERED"
      : deliveredCount > 0
        ? "PARTIAL"
        : retryingCount > 0
          ? "PENDING"
          : failedCount > 0
            ? "FAILED"
            : "PENDING";

  await prisma.leadExport.update({
    where: { id: input.exportId },
    data: {
      status,
      deliveredAt: status === "DELIVERED" ? new Date() : null,
      lastError:
        status === "FAILED"
          ? attempts.find((attempt) => attempt.errorMessage)?.errorMessage ??
            "Export delivery failed."
          : null,
    },
  });
}

async function getLeadExportPayloadInput(input: {
  organizationId: string;
  leadId: string;
  conversationId?: string | null;
  bookingRequestId?: string | null;
  eventType: DestinationEventType;
  includeRawConversation: boolean;
}) {
  const prisma = getPrismaClient();
  const [organization, lead, conversation, booking] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        defaultLocale: true,
        languageMode: true,
        primaryMarket: true,
        planTier: true,
      },
    }),
    prisma.lead.findFirst({
      where: { id: input.leadId, organizationId: input.organizationId },
      include: {
        sourceChannel: {
          select: { id: true, type: true, displayName: true },
        },
        contactIdentities: {
          select: {
            channelType: true,
            externalContactId: true,
            displayName: true,
            email: true,
            phone: true,
            handle: true,
            confidence: true,
          },
          orderBy: { lastSeenAt: "desc" },
        },
      },
    }),
    input.conversationId
      ? prisma.conversation.findFirst({
          where: {
            id: input.conversationId,
            organizationId: input.organizationId,
          },
          include: {
            channel: { select: { id: true, type: true, displayName: true } },
            messages: {
              select: {
                direction: true,
                senderType: true,
                displayBody: true,
                body: true,
                detectedLanguage: true,
                createdAt: true,
              },
              orderBy: { createdAt: "asc" },
              take: input.includeRawConversation ? 40 : 0,
            },
          },
        })
      : null,
    input.bookingRequestId
      ? prisma.bookingRequest.findFirst({
          where: {
            id: input.bookingRequestId,
            organizationId: input.organizationId,
          },
          include: { meetingType: { select: { name: true } } },
        })
      : null,
  ]);

  if (!organization || !lead) {
    throw new Error("Workspace or lead not found for export.");
  }

  const idempotencyKey = buildExportIdempotencyKey({
    organizationId: input.organizationId,
    leadId: input.leadId,
    conversationId: input.conversationId,
    bookingRequestId: input.bookingRequestId,
    eventType: input.eventType,
  });

  return {
    eventType: input.eventType,
    idempotencyKey,
    includeRawConversation: input.includeRawConversation,
    workspace: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      defaultLocale: organization.defaultLocale,
      languageMode: organization.languageMode,
      primaryMarket: organization.primaryMarket,
      planTier: organization.planTier,
    },
    lead,
    conversation,
    booking,
  };
}

function mapDestination(destination: {
  id: string;
  organizationId: string;
  name: string;
  provider: string;
  endpointUrl: string | null;
  secretEncrypted: string | null;
  headers: Prisma.JsonValue;
  maxAttempts: number;
}): DestinationSnapshot {
  return {
    id: destination.id,
    organizationId: destination.organizationId,
    name: destination.name,
    provider: destination.provider as DestinationSnapshot["provider"],
    endpointUrl: destination.endpointUrl,
    secretEncrypted: destination.secretEncrypted,
    headers: parseHeaders(destination.headers),
    maxAttempts: destination.maxAttempts,
  };
}

function parseHeaders(value: Prisma.JsonValue): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([key, item]) => [key, item]),
  );
}

function fromJsonPayload(value: Prisma.JsonValue): ExportPayload {
  return value as unknown as ExportPayload;
}

function toJson(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

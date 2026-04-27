import { buildExportIdempotencyKey, buildLeadExportPayload } from "@/lib/destinations";
import { getPrismaClient } from "@/server/db";

export type DestinationsPageData = Awaited<ReturnType<typeof getDestinationsPageData>>;

export async function getDestinationsPageData(input: {
  organizationId: string;
}) {
  const prisma = getPrismaClient();
  const [organization, destinations, attempts, latestLead] = await Promise.all([
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
    prisma.outboundDestination.findMany({
      where: { organizationId: input.organizationId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.exportDeliveryAttempt.findMany({
      where: { organizationId: input.organizationId },
      include: {
        destination: { select: { id: true, name: true, provider: true } },
        export: {
          select: {
            id: true,
            eventType: true,
            status: true,
            idempotencyKey: true,
            createdAt: true,
            lead: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.lead.findFirst({
      where: { organizationId: input.organizationId },
      include: {
        sourceChannel: { select: { id: true, type: true, displayName: true } },
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
        conversations: {
          select: {
            id: true,
            status: true,
            summary: true,
            internalNotes: true,
            lastMessageAt: true,
            lastInboundAt: true,
            lastOutboundAt: true,
            externalThreadId: true,
            engineState: true,
            channel: { select: { id: true, type: true, displayName: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
        bookings: {
          select: {
            id: true,
            status: true,
            startsAt: true,
            endsAt: true,
            timezone: true,
            provider: true,
            externalEventId: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
            summary: true,
            confirmedAt: true,
            meetingType: { select: { name: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const previewPayload =
    organization && latestLead
      ? buildLeadExportPayload({
          eventType: "LEAD_QUALIFIED",
          idempotencyKey: buildExportIdempotencyKey({
            organizationId: organization.id,
            leadId: latestLead.id,
            conversationId: latestLead.conversations[0]?.id,
            bookingRequestId: latestLead.bookings[0]?.id,
            eventType: "LEAD_QUALIFIED",
          }),
          workspace: organization,
          lead: latestLead,
          conversation: latestLead.conversations[0] ?? null,
          booking: latestLead.bookings[0] ?? null,
        })
      : samplePayload(input.organizationId);

  return {
    destinations,
    attempts,
    previewPayload,
  };
}

function samplePayload(organizationId: string) {
  return {
    version: "northline.lead_export.v1",
    event: {
      type: "LEAD_QUALIFIED",
      idempotencyKey: `northline:lead-export:${organizationId}:LEAD_QUALIFIED:sample:lead`,
      exportedAt: new Date(0).toISOString(),
    },
    workspace: {
      id: organizationId,
      name: "Northline Demo Workspace",
      slug: "northline-demo",
      defaultLocale: "EN",
      languageMode: "BILINGUAL",
      primaryMarket: "GR",
      planTier: "PREVIEW",
    },
    lead: {
      id: "sample-lead",
      status: "SALES_READY",
      score: 82,
      qualificationConfidence: 91,
      fullName: "Maria Demo",
      email: "maria@example.com",
      phone: "+306901234567",
      preferredContactMethod: "email",
      serviceInterest: "AI sales assistant setup",
      budget: "1200 EUR",
      location: "Athens",
      urgency: "this week",
      bookingIntent: true,
      preferredLocale: "EN",
      summary: "Qualified inbound lead interested in booking a discovery call.",
      qualificationData: {},
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString(),
    },
    contactIdentities: [],
    sourceChannel: {
      id: "sample-channel",
      type: "WEBSITE_CHAT",
      displayName: "Website chat",
    },
    conversation: null,
    booking: null,
    timestamps: {
      exportedAt: new Date(0).toISOString(),
      leadCreatedAt: new Date(0).toISOString(),
      leadUpdatedAt: new Date(0).toISOString(),
    },
  };
}

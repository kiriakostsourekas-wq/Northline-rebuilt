import { Prisma } from "@/generated/prisma/client";
import {
  deletedText,
  normalizeDataSubjectSelector,
  safeExportJson,
} from "@/lib/privacy/data-subject";
import { writeAuditLog } from "@/server/audit/service";
import { getPrismaClient } from "@/server/db";

export async function getDataSubjectExportPreview(input: {
  organizationId: string;
  selector: string;
}) {
  const selector = normalizeDataSubjectSelector(input.selector);
  if (!selector) {
    return { ok: false as const, error: "Enter a valid email or phone number." };
  }

  const prisma = getPrismaClient();
  const leads = await prisma.lead.findMany({
    where: {
      organizationId: input.organizationId,
      ...(selector.type === "email"
        ? { email: selector.value }
        : { phone: { contains: selector.value.replace(/[^\d+]/g, "") } }),
    },
    include: {
      contactIdentities: true,
      conversations: {
        include: {
          channel: { select: { type: true, displayName: true } },
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
            take: 100,
          },
          handoffs: true,
        },
      },
      bookings: true,
      exports: {
        select: {
          id: true,
          eventType: true,
          status: true,
          createdAt: true,
          deliveredAt: true,
        },
      },
    },
    take: 10,
  });

  return {
    ok: true as const,
    selector,
    leads,
    exportJson: safeExportJson({
      exportedAt: new Date().toISOString(),
      selector,
      leads,
    }),
  };
}

export async function anonymizeLeadPersonalData(input: {
  organizationId: string;
  leadId: string;
  actorUserId: string;
}) {
  const prisma = getPrismaClient();
  const deletedAt = new Date();
  const marker = deletedText(deletedAt);

  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({
      where: { id: input.leadId, organizationId: input.organizationId },
      select: { id: true },
    });
    if (!lead) throw new Error("Lead not found for data deletion.");

    const identities = await tx.contactIdentity.findMany({
      where: { leadId: lead.id, organizationId: input.organizationId },
      select: { id: true },
    });

    await tx.lead.update({
      where: { id: lead.id },
      data: {
        fullName: null,
        email: null,
        phone: null,
        preferredContactMethod: null,
        budget: null,
        freeformNotes: null,
        qualificationData: Prisma.JsonNull,
        summary: marker,
        consentAt: null,
        consentSource: null,
        status: "DISQUALIFIED",
      },
    });

    for (const identity of identities) {
      await tx.contactIdentity.update({
        where: { id: identity.id },
        data: {
          externalContactId: `deleted:${lead.id}:${identity.id}`,
          displayName: null,
          email: null,
          phone: null,
          handle: null,
          metadata: Prisma.JsonNull,
        },
      });
    }

    const conversations = await tx.conversation.findMany({
      where: { leadId: lead.id, organizationId: input.organizationId },
      select: { id: true },
    });

    await tx.conversation.updateMany({
      where: { leadId: lead.id, organizationId: input.organizationId },
      data: {
        summary: marker,
        internalNotes: null,
        lastMessagePreview: marker,
      },
    });
    await tx.message.updateMany({
      where: { conversationId: { in: conversations.map((item) => item.id) } },
      data: {
        body: marker,
        rawBody: null,
        displayBody: marker,
        normalizedBody: null,
        searchBody: null,
        languageMetadata: Prisma.JsonNull,
        metadata: Prisma.JsonNull,
      },
    });
    await tx.bookingRequest.updateMany({
      where: { leadId: lead.id, organizationId: input.organizationId },
      data: {
        customerName: null,
        customerEmail: null,
        customerPhone: null,
        summary: marker,
        notes: null,
        cancellationReason: null,
        structuredData: Prisma.JsonNull,
      },
    });
    await tx.handoff.updateMany({
      where: { leadId: lead.id },
      data: { reason: marker },
    });
    await tx.leadExport.updateMany({
      where: { leadId: lead.id, organizationId: input.organizationId },
      data: {
        payload: toJson({ redacted: true, redactedAt: deletedAt.toISOString() }),
        lastError: null,
      },
    });
    await writeAuditLog({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: "DATA_SUBJECT_ANONYMIZED",
      targetType: "Lead",
      targetId: lead.id,
      metadata: { conversationCount: conversations.length },
      prisma: tx,
    });

    return { leadId: lead.id, anonymizedAt: deletedAt };
  });
}

function toJson(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

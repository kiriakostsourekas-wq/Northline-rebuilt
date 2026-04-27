import { Prisma } from "@/generated/prisma/client";
import { sendOutboundMessage } from "@/lib/channels/service";
import { runConversationEngineWithLlm } from "@/lib/conversation-engine/llm-enhanced-engine";
import type {
  ConversationEngineDecision,
  LeadFieldKey,
  LeadSnapshot,
} from "@/lib/conversation-engine/types";
import {
  isAiPausedForHandoff,
  resolveAutomaticHandoff,
} from "@/lib/handoff/rules";
import { safeErrorMessage } from "@/lib/security/logging";
import { assembleBusinessContextBundle } from "@/lib/knowledge/context";
import type { BusinessContextRecord } from "@/lib/knowledge/types";
import { advanceBookingWorkflow } from "@/server/booking/service";
import { createPrismaChannelRepository } from "@/server/channels/prisma-channel-repository";
import { ensureDefaultQualificationPlaybook } from "@/server/conversation-engine/playbooks";
import { triggerLeadExport } from "@/server/destinations/service";
import { getPrismaClient } from "@/server/db";
import { requestHandoff } from "@/server/handoff/service";

export async function runConversationEngineForInbound(input: {
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
      organization: {
        select: {
          id: true,
          name: true,
          websiteUrl: true,
          primaryMarket: true,
          defaultLocale: true,
          languageMode: true,
        },
      },
      lead: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          direction: true,
          senderType: true,
          body: true,
          rawBody: true,
          displayBody: true,
          normalizedBody: true,
          createdAt: true,
        },
      },
      handoffs: {
        where: { status: { in: ["REQUESTED", "ACCEPTED"] } },
        select: { id: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!conversation?.lead) {
    throw new Error("Conversation needs a lead before the engine can run.");
  }

  if (
    isAiPausedForHandoff({
      aiResponderState: conversation.aiResponderState,
      activeHandoffStatus: conversation.handoffs[0]?.status,
    })
  ) {
    console.info("northline.conversation_engine.skipped_paused_handoff", {
      conversationId: conversation.id,
      organizationId: input.organizationId,
      aiResponderState: conversation.aiResponderState,
      handoffStatus: conversation.handoffs[0]?.status,
    });
    return null;
  }

  const latestInbound = [...conversation.messages]
    .reverse()
    .find((message) => message.direction === "INBOUND");
  if (!latestInbound) {
    throw new Error("Conversation has no inbound message to process.");
  }

  const [businessContextItems, playbook] = await Promise.all([
    prisma.businessContextItem.findMany({
      where: {
        organizationId: input.organizationId,
        status: "PUBLISHED",
      },
    }),
    ensureDefaultQualificationPlaybook({
      organizationId: input.organizationId,
      prisma,
    }),
  ]);
  const businessContext = assembleBusinessContextBundle({
    workspace: {
      name: conversation.organization.name,
      websiteUrl: conversation.organization.websiteUrl,
      primaryMarket: conversation.organization.primaryMarket,
      defaultLocale: conversation.organization.defaultLocale,
      languageMode: conversation.organization.languageMode,
    },
    items: businessContextItems.map(mapBusinessContextItem),
  });
  const decision = await runConversationEngineWithLlm({
    workspace: {
      name: conversation.organization.name,
      defaultLocale: conversation.organization.defaultLocale,
      languageMode: conversation.organization.languageMode,
    },
    lead: leadSnapshot(conversation.lead),
    messages: conversation.messages,
    latestMessage:
      latestInbound.rawBody ?? latestInbound.displayBody ?? latestInbound.body,
    businessContext,
    playbook: playbook.definition,
  });

  await persistEngineDecision({
    organizationId: input.organizationId,
    conversationId: conversation.id,
    leadId: conversation.lead.id,
    decision,
    questionIdsByField: playbook.questionIdsByField,
  });
  const automaticHandoff = resolveAutomaticHandoff({
    decision,
    latestMessage:
      latestInbound.rawBody ?? latestInbound.displayBody ?? latestInbound.body,
    lead: leadSnapshot(conversation.lead),
  });
  const bookingWorkflow = automaticHandoff.shouldHandoff
    ? null
    : await advanceBookingWorkflow({
        organizationId: input.organizationId,
        conversationId: conversation.id,
        leadId: conversation.lead.id,
        latestMessage:
          latestInbound.rawBody ?? latestInbound.displayBody ?? latestInbound.body,
        decision,
      });

  await sendOutboundMessage(createPrismaChannelRepository(prisma), {
    organizationId: input.organizationId,
    conversationId: conversation.id,
    body: bookingWorkflow?.replyOverride ?? decision.reply,
    senderType: "ASSISTANT",
    statusAfterSend:
      automaticHandoff.shouldHandoff
        ? "WAITING_ON_BUSINESS"
        : bookingWorkflow?.status === "CONFIRMED"
          ? "WAITING_ON_BUSINESS"
          : decision.nextConversationStatus,
    metadata: {
      engine: decision.ai
        ? "northline_llm_orchestrated_v1"
        : "northline_deterministic_v1",
      ai: decision.ai,
      intent: decision.intent,
      confidence: decision.confidence,
      missingFields: decision.missingFields,
      shouldEscalate: decision.shouldEscalate,
      handoff: automaticHandoff.shouldHandoff
        ? {
            reason: automaticHandoff.reason,
            trigger: automaticHandoff.trigger,
            severity: automaticHandoff.severity,
          }
        : undefined,
      booking: bookingWorkflow
        ? {
            bookingId: bookingWorkflow.bookingId,
            status: bookingWorkflow.status,
          }
        : undefined,
    },
  });

  if (automaticHandoff.shouldHandoff) {
    await requestHandoff({
      organizationId: input.organizationId,
      conversationId: conversation.id,
      reason: automaticHandoff.reason,
      source: "AUTOMATIC",
    });
  } else {
    await maybeTriggerQualifiedLeadExport({
      organizationId: input.organizationId,
      leadId: conversation.lead.id,
      conversationId: conversation.id,
      decision,
    });
  }

  return decision;
}

async function maybeTriggerQualifiedLeadExport(input: {
  organizationId: string;
  leadId: string;
  conversationId: string;
  decision: ConversationEngineDecision;
}) {
  if (
    input.decision.leadStatus !== "QUALIFIED" &&
    input.decision.leadStatus !== "SALES_READY"
  ) {
    return;
  }

  try {
    await triggerLeadExport({
      organizationId: input.organizationId,
      leadId: input.leadId,
      conversationId: input.conversationId,
      eventType: "LEAD_QUALIFIED",
    });
  } catch (error) {
    console.error("northline.export.lead_qualified_failed", {
      leadId: input.leadId,
      conversationId: input.conversationId,
      error: safeErrorMessage(error),
    });
  }
}

async function persistEngineDecision(input: {
  organizationId: string;
  conversationId: string;
  leadId: string;
  decision: ConversationEngineDecision;
  questionIdsByField: Map<LeadFieldKey, string>;
}) {
  const prisma = getPrismaClient();
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: input.leadId },
      data: {
        fullName: input.decision.mergedLead.name ?? null,
        email: input.decision.mergedLead.email?.toLowerCase() ?? null,
        phone: input.decision.mergedLead.phone ?? null,
        preferredContactMethod:
          input.decision.mergedLead.preferredContactMethod ?? null,
        serviceInterest: input.decision.mergedLead.serviceInterest ?? null,
        budget: input.decision.mergedLead.budget ?? null,
        location: input.decision.mergedLead.location ?? null,
        urgency: input.decision.mergedLead.urgency ?? null,
        bookingIntent: input.decision.mergedLead.bookingIntent === true,
        freeformNotes: input.decision.mergedLead.freeformNotes ?? null,
        qualificationData: toJson({
          extractedFields: input.decision.extractedFields,
          missingFields: input.decision.missingFields,
          askedFields: input.decision.askedFields,
          intent: input.decision.intent,
          intentConfidence: input.decision.intentConfidence,
          engineState: input.decision.state,
          ai: input.decision.ai,
        }),
        qualificationConfidence: Math.round(input.decision.confidence * 100),
        lastQualifiedAt: now,
        preferredLocale: input.decision.replyLocale,
        status: input.decision.leadStatus,
        score: input.decision.score,
        summary: input.decision.summary,
      },
    });

    for (const [field, value] of answerValues(input.decision.mergedLead)) {
      const questionId = input.questionIdsByField.get(field);
      if (!questionId) continue;
      await tx.qualificationAnswer.upsert({
        where: {
          leadId_questionId: {
            leadId: input.leadId,
            questionId,
          },
        },
        create: {
          leadId: input.leadId,
          questionId,
          value,
        },
        update: { value },
      });
    }

    await tx.conversation.update({
      where: { id: input.conversationId },
      data: {
        summary: input.decision.summary,
        internalNotes: input.decision.internalNotes,
        engineState: toJson(input.decision.state),
        status: input.decision.nextConversationStatus,
      },
    });
  });
}

function leadSnapshot(lead: {
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
  freeformNotes: string | null;
  preferredLocale: "EN" | "EL" | null;
  status: string;
  score: number;
  summary: string | null;
}): LeadSnapshot {
  return {
    id: lead.id,
    name: lead.fullName ?? undefined,
    email: lead.email ?? undefined,
    phone: lead.phone ?? undefined,
    preferredContactMethod: lead.preferredContactMethod ?? undefined,
    serviceInterest: lead.serviceInterest ?? undefined,
    budget: lead.budget ?? undefined,
    location: lead.location ?? undefined,
    urgency: lead.urgency ?? undefined,
    bookingIntent: lead.bookingIntent,
    freeformNotes: lead.freeformNotes ?? undefined,
    preferredLocale: lead.preferredLocale,
    status: lead.status,
    score: lead.score,
    summary: lead.summary,
  };
}

function answerValues(lead: LeadSnapshot): Array<[LeadFieldKey, string]> {
  return [
    lead.name ? ["name", lead.name] : null,
    lead.email || lead.phone
      ? ["contact_method", lead.email ?? lead.phone ?? ""]
      : null,
    lead.serviceInterest ? ["service_interest", lead.serviceInterest] : null,
    lead.urgency ? ["urgency", lead.urgency] : null,
    lead.location ? ["location", lead.location] : null,
    lead.budget ? ["budget", lead.budget] : null,
    lead.preferredContactMethod
      ? ["preferred_contact_method", lead.preferredContactMethod]
      : null,
  ].filter(Boolean) as Array<[LeadFieldKey, string]>;
}

function mapBusinessContextItem(row: {
  id: string;
  section: string;
  locale: "EN" | "EL" | null;
  title: string;
  rawText: string;
  normalizedText: string;
  structuredData: Prisma.JsonValue;
  status: string;
  updatedAt: Date;
}): BusinessContextRecord {
  return {
    id: row.id,
    section: row.section as BusinessContextRecord["section"],
    locale: row.locale,
    title: row.title,
    rawText: row.rawText,
    normalizedText: row.normalizedText,
    structuredData: toObject(row.structuredData),
    status: row.status as BusinessContextRecord["status"],
    updatedAt: row.updatedAt,
  };
}

function toObject(value: Prisma.JsonValue) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toJson(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { buildHandoffSummary } from "@/lib/handoff/summary";
import { getPrismaClient } from "@/server/db";

type HandoffSource = "MANUAL" | "AUTOMATIC" | "STATUS_CHANGE" | "ASSIGNMENT";

type HandoffPrisma = PrismaClient | Prisma.TransactionClient;

export async function requestHandoff(input: {
  organizationId: string;
  conversationId: string;
  actorUserId?: string | null;
  assignedUserId?: string | null;
  reason: string;
  source: HandoffSource;
  prisma?: PrismaClient;
}) {
  const prisma = input.prisma ?? getPrismaClient();
  const reason = input.reason.trim() || "Human review requested.";

  return prisma.$transaction(async (tx) => {
    const conversation = await getConversationForHandoff(tx, {
      organizationId: input.organizationId,
      conversationId: input.conversationId,
    });

    if (!conversation.leadId || !conversation.lead) {
      throw new Error("Conversation needs a lead before handoff can be requested.");
    }

    const assignedUser = await validateOptionalOperator(tx, {
      organizationId: input.organizationId,
      assignedUserId: input.assignedUserId,
    });
    const now = new Date();
    const activeHandoff = await getActiveHandoff(tx, {
      conversationId: conversation.id,
      leadId: conversation.leadId,
    });
    const handoff = activeHandoff
      ? await tx.handoff.update({
          where: { id: activeHandoff.id },
          data: {
            reason,
            status: input.assignedUserId ? "ACCEPTED" : activeHandoff.status,
            assignedUserId: input.assignedUserId ?? activeHandoff.assignedUserId,
          },
          select: { id: true, status: true },
        })
      : await tx.handoff.create({
          data: {
            leadId: conversation.leadId,
            conversationId: conversation.id,
            assignedUserId: input.assignedUserId,
            status: input.assignedUserId ? "ACCEPTED" : "REQUESTED",
            reason,
          },
          select: { id: true, status: true },
        });
    const summary = buildHandoffSummary({
      reason,
      lead: conversation.lead,
      existingSummary: conversation.summary,
      messages: conversation.messages,
    });

    await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        status: "WAITING_ON_BUSINESS",
        assignedUserId: input.assignedUserId ?? conversation.assignedUserId,
        summary,
        aiResponderState: "PAUSED",
        aiPausedAt: now,
        aiPauseReason: reason,
        handoffRequestedAt: conversation.handoffRequestedAt ?? now,
      },
    });
    await tx.lead.update({
      where: { id: conversation.leadId },
      data: {
        status: "HANDED_OFF",
        ownerId: input.assignedUserId ?? undefined,
        summary,
      },
    });

    const eventBase = {
      organizationId: input.organizationId,
      conversationId: conversation.id,
      leadId: conversation.leadId,
      handoffId: handoff.id,
      actorUserId: input.actorUserId,
      reason,
      metadata: toJson({ source: input.source }),
    };
    await tx.handoffEvent.createMany({
      data: [
        {
          ...eventBase,
          eventType: "REQUESTED",
          note: assignedUser
            ? `Assigned to ${operatorLabel(assignedUser)}.`
            : undefined,
        },
        {
          ...eventBase,
          eventType: "AI_PAUSED",
          note: "Assistant automation paused for human review.",
        },
      ],
    });

    return { handoffId: handoff.id, status: handoff.status };
  });
}

export async function assignOperator(input: {
  organizationId: string;
  conversationId: string;
  actorUserId: string;
  assignedUserId?: string | null;
  prisma?: PrismaClient;
}) {
  const prisma = input.prisma ?? getPrismaClient();

  return prisma.$transaction(async (tx) => {
    const conversation = await getConversationForHandoff(tx, {
      organizationId: input.organizationId,
      conversationId: input.conversationId,
    });

    if (!conversation.leadId || !conversation.lead) {
      throw new Error("Conversation needs a lead before it can be assigned.");
    }

    const assignedUser = await validateOptionalOperator(tx, {
      organizationId: input.organizationId,
      assignedUserId: input.assignedUserId,
    });
    const now = new Date();
    const activeHandoff =
      (await getActiveHandoff(tx, {
        conversationId: conversation.id,
        leadId: conversation.leadId,
      })) ??
      (await tx.handoff.create({
        data: {
          leadId: conversation.leadId,
          conversationId: conversation.id,
          assignedUserId: input.assignedUserId,
          status: input.assignedUserId ? "ACCEPTED" : "REQUESTED",
          reason: "Operator assignment from inbox.",
        },
        select: { id: true, assignedUserId: true, status: true },
      }));
    const summary =
      conversation.summary ??
      buildHandoffSummary({
        reason: "Operator assignment from inbox.",
        lead: conversation.lead,
        messages: conversation.messages,
      });

    await tx.handoff.update({
      where: { id: activeHandoff.id },
      data: {
        assignedUserId: input.assignedUserId ?? null,
        status: input.assignedUserId ? "ACCEPTED" : "REQUESTED",
      },
    });
    await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        assignedUserId: input.assignedUserId ?? null,
        status: "WAITING_ON_BUSINESS",
        summary,
        aiResponderState: "PAUSED",
        aiPausedAt: conversation.aiPausedAt ?? now,
        aiPauseReason:
          conversation.aiPauseReason ?? "Conversation assigned to an operator.",
        handoffRequestedAt: conversation.handoffRequestedAt ?? now,
      },
    });
    await tx.lead.update({
      where: { id: conversation.leadId },
      data: {
        status: "HANDED_OFF",
        ownerId: input.assignedUserId ?? null,
      },
    });

    const note = assignedUser
      ? `Assigned to ${operatorLabel(assignedUser)}.`
      : "Moved back to the unassigned operator queue.";
    const events: Prisma.HandoffEventCreateManyInput[] = [
      {
        organizationId: input.organizationId,
        conversationId: conversation.id,
        leadId: conversation.leadId,
        handoffId: activeHandoff.id,
        actorUserId: input.actorUserId,
        eventType: "ASSIGNED",
        note,
        metadata: toJson({
          assignedUserId: input.assignedUserId ?? null,
        }),
      },
    ];

    if (input.assignedUserId) {
      events.push({
        organizationId: input.organizationId,
        conversationId: conversation.id,
        leadId: conversation.leadId,
        handoffId: activeHandoff.id,
        actorUserId: input.actorUserId,
        eventType: "ACCEPTED",
        note: "Operator accepted ownership of the handoff.",
        metadata: toJson({ assignedUserId: input.assignedUserId }),
      });
    }

    if (conversation.aiResponderState !== "PAUSED") {
      events.push({
        organizationId: input.organizationId,
        conversationId: conversation.id,
        leadId: conversation.leadId,
        handoffId: activeHandoff.id,
        actorUserId: input.actorUserId,
        eventType: "AI_PAUSED",
        note: "Assistant automation paused because an operator was assigned.",
        metadata: toJson({ source: "ASSIGNMENT" }),
      });
    }

    await tx.handoffEvent.createMany({ data: events });

    return { handoffId: activeHandoff.id, assignedUserId: input.assignedUserId };
  });
}

export async function resumeAi(input: {
  organizationId: string;
  conversationId: string;
  actorUserId: string;
  reason?: string | null;
  prisma?: PrismaClient;
}) {
  const prisma = input.prisma ?? getPrismaClient();
  const reason = input.reason?.trim() || "Operator resumed AI assistance.";

  return prisma.$transaction(async (tx) => {
    const conversation = await getConversationForHandoff(tx, {
      organizationId: input.organizationId,
      conversationId: input.conversationId,
    });
    const activeHandoffs = await tx.handoff.findMany({
      where: {
        conversationId: conversation.id,
        status: { in: ["REQUESTED", "ACCEPTED"] },
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    const handoffId = activeHandoffs[0]?.id;

    if (activeHandoffs.length) {
      await tx.handoff.updateMany({
        where: { id: { in: activeHandoffs.map((handoff) => handoff.id) } },
        data: { status: "RESOLVED" },
      });
    }

    await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        status: conversation.status === "CLOSED" ? "CLOSED" : "OPEN",
        aiResponderState: "ACTIVE",
        aiResumedAt: new Date(),
        aiPauseReason: null,
      },
    });
    await tx.handoffEvent.createMany({
      data: [
        {
          organizationId: input.organizationId,
          conversationId: conversation.id,
          leadId: conversation.leadId,
          handoffId,
          actorUserId: input.actorUserId,
          eventType: "RESOLVED",
          reason,
          note: "Human handoff resolved.",
          metadata: toJson({ source: "MANUAL" }),
        },
        {
          organizationId: input.organizationId,
          conversationId: conversation.id,
          leadId: conversation.leadId,
          handoffId,
          actorUserId: input.actorUserId,
          eventType: "AI_RESUMED",
          reason,
          note: "Assistant automation may respond to future inbound messages.",
          metadata: toJson({ source: "MANUAL" }),
        },
      ],
    });

    return { resumed: true, resolvedHandoffCount: activeHandoffs.length };
  });
}

export async function addInternalNote(input: {
  organizationId: string;
  conversationId: string;
  actorUserId: string;
  note: string;
  prisma?: PrismaClient;
}) {
  const prisma = input.prisma ?? getPrismaClient();
  const note = input.note.trim();
  if (!note) throw new Error("Internal note is required.");

  return prisma.$transaction(async (tx) => {
    const [conversation, actor] = await Promise.all([
      getConversationForHandoff(tx, {
        organizationId: input.organizationId,
        conversationId: input.conversationId,
      }),
      tx.user.findFirst({
        where: {
          id: input.actorUserId,
          organizationId: input.organizationId,
        },
        select: { id: true, name: true, email: true },
      }),
    ]);
    const activeHandoff = conversation.leadId
      ? await getActiveHandoff(tx, {
          conversationId: conversation.id,
          leadId: conversation.leadId,
        })
      : null;
    const timestamp = new Date().toISOString();
    const actorLabel = actor ? operatorLabel(actor) : "Operator";
    const noteEntry = `[${timestamp}] ${actorLabel}: ${note}`;

    await tx.conversation.update({
      where: { id: conversation.id },
      data: {
        internalNotes: conversation.internalNotes
          ? `${conversation.internalNotes}\n\n${noteEntry}`
          : noteEntry,
      },
    });
    await tx.handoffEvent.create({
      data: {
        organizationId: input.organizationId,
        conversationId: conversation.id,
        leadId: conversation.leadId,
        handoffId: activeHandoff?.id,
        actorUserId: input.actorUserId,
        eventType: "NOTE_ADDED",
        note,
        metadata: toJson({ source: "OPERATOR_NOTE" }),
      },
    });

    return { added: true };
  });
}

async function getConversationForHandoff(
  prisma: HandoffPrisma,
  input: { organizationId: string; conversationId: string },
) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      organizationId: input.organizationId,
    },
    include: {
      lead: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          direction: true,
          senderType: true,
          body: true,
          rawBody: true,
          displayBody: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) {
    throw new Error("Conversation was not found in this workspace.");
  }

  return conversation;
}

async function getActiveHandoff(
  prisma: HandoffPrisma,
  input: { conversationId: string; leadId: string },
) {
  return prisma.handoff.findFirst({
    where: {
      conversationId: input.conversationId,
      leadId: input.leadId,
      status: { in: ["REQUESTED", "ACCEPTED"] },
    },
    select: { id: true, assignedUserId: true, status: true },
    orderBy: { createdAt: "desc" },
  });
}

async function validateOptionalOperator(
  prisma: HandoffPrisma,
  input: { organizationId: string; assignedUserId?: string | null },
) {
  if (!input.assignedUserId) return null;

  const user = await prisma.user.findFirst({
    where: {
      id: input.assignedUserId,
      organizationId: input.organizationId,
    },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    throw new Error("Assigned operator must belong to this workspace.");
  }

  return user;
}

function operatorLabel(user: { name: string | null; email: string }) {
  return user.name?.trim() || user.email;
}

function toJson(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

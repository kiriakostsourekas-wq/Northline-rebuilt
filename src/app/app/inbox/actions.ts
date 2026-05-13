"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { websiteChatAdapter } from "@/lib/channels/adapters/website-chat";
import { ingestInboundEvent, sendOutboundMessage } from "@/lib/channels/service";
import { requireCompletedOnboarding } from "@/lib/auth/guards";
import { createPrismaChannelRepository } from "@/server/channels/prisma-channel-repository";
import { runConversationEngineForInbound } from "@/server/conversation-engine/service";
import { getPrismaClient } from "@/server/db";
import {
  addInternalNote,
  assignOperator,
  requestHandoff,
  resumeAi,
} from "@/server/handoff/service";
import { safeErrorMessage } from "@/lib/security/logging";

const conversationStatuses = [
  "OPEN",
  "WAITING_ON_LEAD",
  "WAITING_ON_BUSINESS",
  "CLOSED",
] as const;

type ConversationStatusInput = (typeof conversationStatuses)[number];

export async function simulateWebsiteChatMessage(formData: FormData) {
  const { organization } = await requireCompletedOnboarding();
  const message = getRequired(formData, "message");
  const name = getOptional(formData, "name") ?? "Website visitor";
  const email = getOptional(formData, "email");
  const phone = getOptional(formData, "phone");
  const providedThreadId = getOptional(formData, "threadId");
  const visitorId =
    getOptional(formData, "visitorId") ??
    email ??
    phone ??
    providedThreadId ??
    `visitor-${randomUUID()}`;
  const threadId = providedThreadId ?? `web-${visitorId}`;
  const messageId = `msg-${randomUUID()}`;
  const payload = {
    organizationId: organization.id,
    eventId: `evt-${messageId}`,
    eventType: "message.created",
    widgetId: "local-widget",
    visitorId,
    threadId,
    messageId,
    message,
    name,
    email,
    phone,
    locale: organization.defaultLocale.toLowerCase(),
    timestamp: new Date().toISOString(),
  };
  const event = websiteChatAdapter.normalizeInbound({
    organizationId: organization.id,
    payload,
    headers: new Headers(),
  });
  const result = await ingestInboundEvent(
    createPrismaChannelRepository(),
    websiteChatAdapter,
    event,
  );

  revalidatePath("/app/inbox");

  if (result.status === "processed") {
    await processAssistantReply({
      organizationId: organization.id,
      conversationId: result.conversationId,
    });
    redirect(`/app/inbox?conversation=${result.conversationId}&notice=message-added`);
  }

  redirect("/app/inbox");
}

export async function sendInboxReply(formData: FormData) {
  const { organization } = await requireCompletedOnboarding();
  const conversationId = getRequired(formData, "conversationId");
  const body = getRequired(formData, "body");

  await sendOutboundMessage(createPrismaChannelRepository(), {
    organizationId: organization.id,
    conversationId,
    body,
    senderType: "HUMAN",
    statusAfterSend: "WAITING_ON_LEAD",
    metadata: { source: "operator_reply" },
  });

  revalidatePath("/app/inbox");
  redirect(`/app/inbox?conversation=${conversationId}&notice=reply-sent`);
}

export async function updateConversationStatus(formData: FormData) {
  const { organization, user } = await requireCompletedOnboarding();
  const conversationId = getRequired(formData, "conversationId");
  const status = parseConversationStatus(getRequired(formData, "status"));

  if (!status) {
    redirect(`/app/inbox?conversation=${conversationId}&error=Invalid status`);
  }

  if (status === "WAITING_ON_BUSINESS") {
    await requestHandoff({
      organizationId: organization.id,
      conversationId,
      actorUserId: user.id,
      reason: "Operator moved the conversation to human handoff.",
      source: "STATUS_CHANGE",
    });
  } else {
    await getPrismaClient().conversation.updateMany({
      where: {
        id: conversationId,
        organizationId: organization.id,
      },
      data: { status },
    });
  }

  revalidatePath("/app/inbox");
  redirect(`/app/inbox?conversation=${conversationId}&notice=status-updated`);
}

export async function requestInboxHandoff(formData: FormData) {
  const { organization, user } = await requireCompletedOnboarding();
  const conversationId = getRequired(formData, "conversationId");
  const reason =
    getOptional(formData, "reason") ?? "Manual handoff requested by operator.";

  await requestHandoff({
    organizationId: organization.id,
    conversationId,
    actorUserId: user.id,
    reason,
    source: "MANUAL",
  });

  revalidatePath("/app/inbox");
  redirect(`/app/inbox?conversation=${conversationId}&notice=handoff-requested`);
}

export async function resumeAiForConversation(formData: FormData) {
  const { organization, user } = await requireCompletedOnboarding();
  const conversationId = getRequired(formData, "conversationId");
  const reason = getOptional(formData, "reason");

  await resumeAi({
    organizationId: organization.id,
    conversationId,
    actorUserId: user.id,
    reason,
  });

  revalidatePath("/app/inbox");
  redirect(`/app/inbox?conversation=${conversationId}&notice=ai-resumed`);
}

export async function assignInboxOperator(formData: FormData) {
  const { organization, user } = await requireCompletedOnboarding();
  const conversationId = getRequired(formData, "conversationId");
  const assignedUserId = getOptional(formData, "assignedUserId") ?? null;

  await assignOperator({
    organizationId: organization.id,
    conversationId,
    actorUserId: user.id,
    assignedUserId,
  });

  revalidatePath("/app/inbox");
  redirect(`/app/inbox?conversation=${conversationId}&notice=assignment-updated`);
}

export async function addConversationInternalNote(formData: FormData) {
  const { organization, user } = await requireCompletedOnboarding();
  const conversationId = getRequired(formData, "conversationId");
  const note = getRequired(formData, "note");

  await addInternalNote({
    organizationId: organization.id,
    conversationId,
    actorUserId: user.id,
    note,
  });

  revalidatePath("/app/inbox");
  redirect(`/app/inbox?conversation=${conversationId}&notice=note-added`);
}

function getRequired(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

function getOptional(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

function parseConversationStatus(value: string): ConversationStatusInput | null {
  return conversationStatuses.includes(value as ConversationStatusInput)
    ? (value as ConversationStatusInput)
    : null;
}

async function processAssistantReply(input: {
  organizationId: string;
  conversationId: string;
}) {
  try {
    await runConversationEngineForInbound(input);
  } catch (error) {
    console.error("northline.conversation_engine.failed", {
      conversationId: input.conversationId,
      error: safeErrorMessage(error),
    });
  }
}

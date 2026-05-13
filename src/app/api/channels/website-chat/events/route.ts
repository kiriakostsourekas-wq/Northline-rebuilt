import type { NextRequest } from "next/server";
import { websiteChatAdapter } from "@/lib/channels/adapters/website-chat";
import { ingestInboundEvent } from "@/lib/channels/service";
import type { IngestionResult } from "@/lib/channels/service";
import { createPrismaChannelRepository } from "@/server/channels/prisma-channel-repository";
import { runConversationEngineForInbound } from "@/server/conversation-engine/service";
import { getPrismaClient } from "@/server/db";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  getRequestIpFromHeaders,
  rateLimitHeaders,
} from "@/lib/security/request";
import { safeErrorMessage } from "@/lib/security/logging";
import type { ConversationEngineDecision } from "@/lib/conversation-engine/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    channel: "website_chat",
    mode: "local-preview",
    requiredPayload: ["workspaceSlug or organizationId", "visitorId", "message"],
    optionalPayload: [
      "threadId",
      "messageId",
      "eventId",
      "name",
      "email",
      "phone",
      "locale",
      "pageUrl",
    ],
  });
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit({
    key: `website-chat:${getRequestIpFromHeaders(request.headers)}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Too many website chat events. Try again shortly." },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const rawBody = await request.text();
  if (rawBody.length > 32_000) {
    return Response.json(
      { error: "Website chat event payload is too large." },
      { status: 413, headers: rateLimitHeaders(rateLimit) },
    );
  }

  let payload: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Expected a JSON object.");
    }
    payload = parsed as Record<string, unknown>;
  } catch {
    return Response.json(
      { error: "Submit a valid JSON object." },
      { status: 400, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const verification = websiteChatAdapter.verifyWebhook({
    headers: request.headers,
    payload,
    rawBody,
  });

  if (!verification.ok) {
    return Response.json(
      { error: verification.message },
      { status: verification.status, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const organizationId = await resolveOrganizationId(payload);
  if (!organizationId) {
    return Response.json(
      { error: "Unknown workspace for website chat event." },
      { status: 404, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const event = websiteChatAdapter.normalizeInbound({
    organizationId,
    payload,
    headers: request.headers,
  });
  const result = await ingestInboundEvent(
    createPrismaChannelRepository(),
    websiteChatAdapter,
    event,
  );
  let assistant: WebsiteChatAssistantResult | null = null;
  if (result.status === "processed") {
    assistant = await processAssistantReply({
      organizationId,
      conversationId: result.conversationId,
    });
  }

  return Response.json(
    buildWebsiteChatResponseBody(result, assistant),
    {
      status: result.status === "duplicate" ? 200 : 202,
      headers: rateLimitHeaders(rateLimit),
    },
  );
}

export function buildWebsiteChatResponseBody(
  result: IngestionResult,
  assistant: WebsiteChatAssistantResult | null,
) {
  return result.status === "processed" ? { ...result, assistant } : result;
}

async function resolveOrganizationId(payload: Record<string, unknown>) {
  const explicitId = getString(payload, "organizationId");
  if (explicitId) return explicitId;

  const workspaceSlug = getString(payload, "workspaceSlug");
  if (!workspaceSlug) return null;

  const organization = await getPrismaClient().organization.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true },
  });

  return organization?.id ?? null;
}

function getString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

type WebsiteChatAssistantResult = {
  reply: string;
  locale: "EN" | "EL";
  leadStatus: ConversationEngineDecision["leadStatus"];
  missingFields: ConversationEngineDecision["missingFields"];
  shouldEscalate: boolean;
};

export function toWebsiteChatAssistantResult(
  decision: ConversationEngineDecision,
): WebsiteChatAssistantResult {
  return {
    reply: decision.reply,
    locale: decision.replyLocale,
    leadStatus: decision.leadStatus,
    missingFields: decision.missingFields,
    shouldEscalate: decision.shouldEscalate,
  };
}

async function processAssistantReply(input: {
  organizationId: string;
  conversationId: string;
}): Promise<WebsiteChatAssistantResult | null> {
  try {
    const decision = await runConversationEngineForInbound(input);
    return decision ? toWebsiteChatAssistantResult(decision) : null;
  } catch (error) {
    console.error("northline.conversation_engine.failed", {
      conversationId: input.conversationId,
      error: safeErrorMessage(error),
    });
    return null;
  }
}

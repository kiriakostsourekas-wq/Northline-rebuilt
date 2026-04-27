"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { requireCompletedOnboarding } from "@/lib/auth/guards";
import { encryptSecret, secretLast4 } from "@/lib/destinations";
import { isStrictProductionRuntime } from "@/lib/security/runtime";
import { writeAuditLog } from "@/server/audit/service";
import { replayExportDelivery } from "@/server/destinations/service";
import { getPrismaClient } from "@/server/db";

const eventTypes = [
  "LEAD_QUALIFIED",
  "LEAD_BOOKED",
  "BOOKING_CONFIRMED",
  "MANUAL_REPLAY",
] as const;

export async function saveWebhookDestinationAction(formData: FormData) {
  const { organization, user } = await requireDestinationManager();
  const destinationId = getOptionalString(formData, "destinationId");
  const name = getRequiredString(formData, "name");
  const endpointUrl = validateWebhookUrl(getRequiredString(formData, "endpointUrl"));
  const status = parseStatus(getRequiredString(formData, "status"));
  const selectedEvents = parseEventTypes(formData.getAll("eventTypes"));
  const secret = getOptionalString(formData, "secret");
  const headers = parseHeaders(getOptionalString(formData, "headers"));
  const maxAttempts = clampNumber(Number(formData.get("maxAttempts")), 1, 8, 3);
  const data: Prisma.OutboundDestinationUpdateInput = {
    name,
    type: "WEBHOOK",
    provider: "WEBHOOK",
    status,
    endpointUrl,
    headers: toJson(headers),
    eventTypes: selectedEvents,
    includeRawConversation: formData.get("includeRawConversation") === "on",
    maxAttempts,
  };

  if (secret) {
    data.secretEncrypted = encryptSecret(secret);
    data.secretLast4 = secretLast4(secret);
  }

  const prisma = getPrismaClient();
  if (destinationId) {
    await prisma.outboundDestination.updateMany({
      where: { id: destinationId, organizationId: organization.id },
      data,
    });
    await writeAuditLog({
      organizationId: organization.id,
      actorUserId: user.id,
      action: "DESTINATION_UPDATED",
      targetType: "OutboundDestination",
      targetId: destinationId,
      metadata: {
        provider: "WEBHOOK",
        status,
        eventTypes: selectedEvents,
        secretChanged: Boolean(secret),
      },
    });
  } else {
    const created = await prisma.outboundDestination.create({
      data: {
        organizationId: organization.id,
        name,
        type: "WEBHOOK",
        provider: "WEBHOOK",
        status,
        endpointUrl,
        headers: toJson(headers),
        eventTypes: selectedEvents,
        includeRawConversation: formData.get("includeRawConversation") === "on",
        maxAttempts,
        secretEncrypted: secret ? encryptSecret(secret) : null,
        secretLast4: secret ? secretLast4(secret) : null,
      },
    });
    await writeAuditLog({
      organizationId: organization.id,
      actorUserId: user.id,
      action: "DESTINATION_CREATED",
      targetType: "OutboundDestination",
      targetId: created.id,
      metadata: {
        provider: "WEBHOOK",
        status,
        eventTypes: selectedEvents,
        secretConfigured: Boolean(secret),
      },
    });
  }

  revalidatePath("/app/destinations");
  redirect("/app/destinations?notice=webhook-saved");
}

export async function replayDeliveryAttemptAction(formData: FormData) {
  const { organization, user } = await requireDestinationManager();
  const attemptId = getRequiredString(formData, "attemptId");
  const attempt = await getPrismaClient().exportDeliveryAttempt.findFirst({
    where: {
      id: attemptId,
      organizationId: organization.id,
    },
    select: {
      exportId: true,
      destinationId: true,
    },
  });

  if (!attempt) {
    redirect("/app/destinations?error=Delivery attempt not found.");
  }

  await replayExportDelivery({
    organizationId: organization.id,
    exportId: attempt.exportId,
    destinationId: attempt.destinationId,
  });
  await writeAuditLog({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "EXPORT_DELIVERY_REPLAYED",
    targetType: "ExportDeliveryAttempt",
    targetId: attemptId,
    metadata: {
      exportId: attempt.exportId,
      destinationId: attempt.destinationId,
    },
  });

  revalidatePath("/app/destinations");
  redirect("/app/destinations?notice=delivery-replayed");
}

async function requireDestinationManager() {
  const context = await requireCompletedOnboarding();
  if (context.user.role !== "OWNER" && context.user.role !== "ADMIN") {
    redirect(
      "/app/destinations?error=Only owners and admins can edit destinations.",
    );
  }
  return context;
}

function validateWebhookUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("Webhook URL must use http or https.");
    }
    if (isStrictProductionRuntime() && url.protocol !== "https:") {
      throw new Error("Webhook URL must use https in production.");
    }
    if (isStrictProductionRuntime() && isPrivateHostname(url.hostname)) {
      throw new Error("Webhook URL cannot target private network hosts in production.");
    }
    return url.toString();
  } catch {
    redirect("/app/destinations?error=Enter a valid webhook URL.");
  }
}

function parseStatus(value: string) {
  if (value === "PAUSED" || value === "DISABLED") return value;
  return "ACTIVE";
}

function parseEventTypes(
  values: FormDataEntryValue[],
): Array<(typeof eventTypes)[number]> {
  const parsed = values
    .map(String)
    .filter((value): value is (typeof eventTypes)[number] =>
      eventTypes.includes(value as (typeof eventTypes)[number]),
    );
  return parsed.length ? parsed : ["LEAD_QUALIFIED", "BOOKING_CONFIRMED"];
}

function parseHeaders(value?: string | null) {
  if (!value) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    redirect("/app/destinations?error=Headers must be a JSON object.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  const headers = Object.entries(parsed as Record<string, unknown>).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  const forbidden = headers.find(([key]) => isForbiddenCustomHeader(key));
  if (forbidden) {
    redirect(
      `/app/destinations?error=${encodeURIComponent(`Header ${forbidden[0]} must be configured by Northline, not stored as a custom header.`)}`,
    );
  }
  return Object.fromEntries(headers);
}

function isForbiddenCustomHeader(key: string) {
  return /^(authorization|cookie|set-cookie|x-northline-signature|x-northline-idempotency-key|x-northline-export-id|content-type)$/i.test(
    key.trim(),
  );
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (normalized === "localhost" || normalized.endsWith(".local")) return true;
  if (/^127\./.test(normalized) || /^10\./.test(normalized)) return true;
  if (/^192\.168\./.test(normalized)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  if (normalized === "::1") return true;
  return false;
}

function getRequiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

function getOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function clampNumber(
  value: number,
  min: number,
  max: number,
  fallback: number,
) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.round(value), min), max);
}

function toJson(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

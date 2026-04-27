import { Prisma } from "@/generated/prisma/client";
import { sanitizeLogValue } from "@/lib/security/logging";
import { getPrismaClient } from "@/server/db";

export async function writeAuditLog(input: {
  organizationId: string;
  actorUserId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  prisma?: ReturnType<typeof getPrismaClient> | Prisma.TransactionClient;
}) {
  const prisma = input.prisma ?? getPrismaClient();

  await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ? toJson(redactAuditMetadata(input.metadata)) : undefined,
    },
  });
}

export function redactAuditMetadata(value: Record<string, unknown>) {
  return sanitizeLogValue(value) as Record<string, unknown>;
}

function toJson(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

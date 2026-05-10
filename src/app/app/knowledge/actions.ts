"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { requireCompletedOnboarding } from "@/lib/auth/guards";
import { validateKnowledgeItemInput } from "@/lib/knowledge/normalization";
import { buildStarterInputs } from "@/lib/knowledge/starter-examples";
import {
  getSectionConfig,
  isBusinessContextSection,
} from "@/lib/knowledge/sections";
import type {
  BusinessContextSectionValue,
  KnowledgeLocale,
  PublicationStatusValue,
} from "@/lib/knowledge/types";
import { writeAuditLog } from "@/server/audit/service";
import { getPrismaClient } from "@/server/db";
import { refreshKnowledgeItemIndex } from "@/server/knowledge/indexing";

export async function saveKnowledgeItemAction(formData: FormData) {
  const { user, organization } = await requireKnowledgeManager();
  const section = parseSection(getRequiredString(formData, "section"));
  const itemId = getOptionalString(formData, "itemId");
  const requestedStatus = parseStatus(getRequiredString(formData, "status"));
  const validation = validateKnowledgeItemInput({
    section,
    title: getRequiredString(formData, "title"),
    locale: parseLocale(getOptionalString(formData, "locale")),
    status: requestedStatus,
    fields: readSectionFields(formData, section),
  });

  if (!validation.ok) {
    redirect(
      `/app/knowledge?section=${section}&error=${encodeURIComponent(validation.errors.join(" "))}`,
    );
  }

  const prisma = getPrismaClient();
  const publishedAt =
    validation.value.status === "PUBLISHED" ? new Date() : null;

  if (itemId) {
    const existing = await prisma.businessContextItem.findFirst({
      where: {
        id: itemId,
        organizationId: organization.id,
      },
      include: { _count: { select: { revisions: true } } },
    });

    if (!existing) {
      redirect(
        `/app/knowledge?section=${section}&error=Knowledge item not found`,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.businessContextRevision.create({
        data: {
          itemId: existing.id,
          organizationId: organization.id,
          changedByUserId: user.id,
          version: existing._count.revisions + 1,
          snapshot: toItemSnapshot(existing),
          changeReason: "Knowledge item edited",
        },
      });
      await tx.businessContextItem.update({
        where: { id: existing.id },
        data: {
          section: validation.value.section,
          locale: validation.value.locale,
          title: validation.value.title,
          rawText: validation.value.rawText,
          normalizedText: validation.value.normalizedText,
          structuredData: toJson(validation.value.structuredData),
          status: validation.value.status,
          updatedByUserId: user.id,
          publishedAt:
            validation.value.status === "PUBLISHED"
              ? existing.publishedAt ?? publishedAt
              : null,
          archivedAt: validation.value.status === "ARCHIVED" ? new Date() : null,
        },
      });
      await writeAuditLog({
        organizationId: organization.id,
        actorUserId: user.id,
        action: "KNOWLEDGE_ITEM_UPDATED",
        targetType: "BusinessContextItem",
        targetId: existing.id,
        metadata: {
          section: validation.value.section,
          status: validation.value.status,
        },
        prisma: tx,
      });
    });

    await refreshKnowledgeIndexAfterMutation({
      organizationId: organization.id,
      itemId: existing.id,
      reason: "Knowledge item saved",
    });
    revalidatePath("/app/knowledge");
    redirect(`/app/knowledge?section=${section}&item=${itemId}&notice=item-saved`);
  }

  const created = await prisma.businessContextItem.create({
    data: {
      organizationId: organization.id,
      section: validation.value.section,
      locale: validation.value.locale,
      title: validation.value.title,
      rawText: validation.value.rawText,
      normalizedText: validation.value.normalizedText,
      structuredData: toJson(validation.value.structuredData),
      status: validation.value.status,
      createdByUserId: user.id,
      updatedByUserId: user.id,
      publishedAt,
    },
  });
  await writeAuditLog({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "KNOWLEDGE_ITEM_CREATED",
    targetType: "BusinessContextItem",
    targetId: created.id,
    metadata: {
      section: validation.value.section,
      status: validation.value.status,
    },
  });
  await refreshKnowledgeIndexAfterMutation({
    organizationId: organization.id,
    itemId: created.id,
    reason: "Knowledge item created",
  });

  revalidatePath("/app/knowledge");
  redirect(`/app/knowledge?section=${section}&item=${created.id}&notice=item-created`);
}

export async function publishKnowledgeItemAction(formData: FormData) {
  const { user, organization } = await requireKnowledgeManager();
  const itemId = getRequiredString(formData, "itemId");
  const prisma = getPrismaClient();
  const item = await prisma.businessContextItem.findFirst({
    where: { id: itemId, organizationId: organization.id },
    include: { _count: { select: { revisions: true } } },
  });

  if (!item) redirect("/app/knowledge?error=Knowledge item not found");

  await prisma.$transaction(async (tx) => {
    await tx.businessContextRevision.create({
      data: {
        itemId: item.id,
        organizationId: organization.id,
        changedByUserId: user.id,
        version: item._count.revisions + 1,
        snapshot: toItemSnapshot(item),
        changeReason: "Knowledge item published",
      },
    });
    await tx.businessContextItem.update({
      where: { id: item.id },
      data: {
        status: "PUBLISHED",
        publishedAt: item.publishedAt ?? new Date(),
        archivedAt: null,
        updatedByUserId: user.id,
      },
    });
    await writeAuditLog({
      organizationId: organization.id,
      actorUserId: user.id,
      action: "KNOWLEDGE_ITEM_PUBLISHED",
      targetType: "BusinessContextItem",
      targetId: item.id,
      metadata: { section: item.section },
      prisma: tx,
    });
  });

  await refreshKnowledgeIndexAfterMutation({
    organizationId: organization.id,
    itemId: item.id,
    reason: "Knowledge item published",
  });
  revalidatePath("/app/knowledge");
  redirect(`/app/knowledge?section=${item.section}&item=${item.id}&notice=item-published`);
}

export async function archiveKnowledgeItemAction(formData: FormData) {
  const { user, organization } = await requireKnowledgeManager();
  const itemId = getRequiredString(formData, "itemId");
  const prisma = getPrismaClient();
  const item = await prisma.businessContextItem.findFirst({
    where: { id: itemId, organizationId: organization.id },
    include: { _count: { select: { revisions: true } } },
  });

  if (!item) redirect("/app/knowledge?error=Knowledge item not found");

  await prisma.$transaction(async (tx) => {
    await tx.businessContextRevision.create({
      data: {
        itemId: item.id,
        organizationId: organization.id,
        changedByUserId: user.id,
        version: item._count.revisions + 1,
        snapshot: toItemSnapshot(item),
        changeReason: "Knowledge item archived",
      },
    });
    await tx.businessContextItem.update({
      where: { id: item.id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        updatedByUserId: user.id,
      },
    });
    await writeAuditLog({
      organizationId: organization.id,
      actorUserId: user.id,
      action: "KNOWLEDGE_ITEM_ARCHIVED",
      targetType: "BusinessContextItem",
      targetId: item.id,
      metadata: { section: item.section },
      prisma: tx,
    });
  });

  await refreshKnowledgeIndexAfterMutation({
    organizationId: organization.id,
    itemId: item.id,
    reason: "Knowledge item archived",
  });
  revalidatePath("/app/knowledge");
  redirect(`/app/knowledge?section=${item.section}&notice=item-archived`);
}

export async function createStarterKnowledgeAction() {
  const { user, organization } = await requireKnowledgeManager();
  const existingCount = await getPrismaClient().businessContextItem.count({
    where: {
      organizationId: organization.id,
      status: { not: "ARCHIVED" },
    },
  });

  if (existingCount > 0) {
    redirect(
      "/app/knowledge?error=Starter examples are only available for an empty knowledge base.",
    );
  }

  const locale = organization.defaultLocale;
  const validItems = buildStarterInputs(locale)
    .map(validateKnowledgeItemInput)
    .filter((result) => result.ok)
    .map((result) => result.value);

  await getPrismaClient().businessContextItem.createMany({
    data: validItems.map((item, index) => ({
      organizationId: organization.id,
      section: item.section,
      locale: item.locale,
      title: item.title,
      rawText: item.rawText,
      normalizedText: item.normalizedText,
      structuredData: toJson(item.structuredData),
      status: "DRAFT",
      sortOrder: index,
      source: "STARTER",
      createdByUserId: user.id,
      updatedByUserId: user.id,
    })),
  });
  await writeAuditLog({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "KNOWLEDGE_STARTER_CREATED",
    targetType: "BusinessContextItem",
    metadata: { count: validItems.length },
  });

  revalidatePath("/app/knowledge");
  redirect("/app/knowledge?notice=starter-examples-added");
}

function readSectionFields(
  formData: FormData,
  section: BusinessContextSectionValue,
) {
  const fields: Record<string, string> = {};
  for (const field of getSectionConfig(section).fields) {
    fields[field.key] = String(formData.get(field.key) ?? "");
  }
  return fields;
}

function parseSection(value: string) {
  if (!isBusinessContextSection(value)) {
    redirect("/app/knowledge?error=Unknown knowledge section.");
  }
  return value;
}

async function requireKnowledgeManager() {
  const context = await requireCompletedOnboarding();
  if (context.user.role !== "OWNER" && context.user.role !== "ADMIN") {
    redirect(
      "/app/knowledge?error=Only owners and admins can edit business knowledge.",
    );
  }

  return context;
}

function parseStatus(value: string): PublicationStatusValue {
  if (value === "PUBLISHED" || value === "ARCHIVED") return value;
  return "DRAFT";
}

function parseLocale(value?: string | null): KnowledgeLocale {
  if (value === "EN" || value === "EL") return value;
  return "MIXED";
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

function toJson(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

async function refreshKnowledgeIndexAfterMutation(input: {
  organizationId: string;
  itemId: string;
  reason: string;
}) {
  try {
    await refreshKnowledgeItemIndex(input);
  } catch (error) {
    console.warn("northline.knowledge.index_refresh_failed", {
      organizationId: input.organizationId,
      itemId: input.itemId,
      reason: input.reason,
      error: error instanceof Error ? error.message : "Unknown indexing error",
    });
  }
}

function toItemSnapshot(item: {
  title: string;
  section: string;
  locale: string | null;
  status: string;
  rawText: string;
  normalizedText: string;
  structuredData: Prisma.JsonValue;
  updatedAt: Date;
}) {
  return toJson({
    title: item.title,
    section: item.section,
    locale: item.locale,
    status: item.status,
    rawText: item.rawText,
    normalizedText: item.normalizedText,
    structuredData: item.structuredData,
    updatedAt: item.updatedAt.toISOString(),
  });
}

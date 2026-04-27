import { Prisma } from "@/generated/prisma/client";
import { assembleBusinessContextBundle } from "@/lib/knowledge/context";
import type {
  BusinessContextRecord,
  BusinessContextSectionValue,
  PublicationStatusValue,
} from "@/lib/knowledge/types";
import { getPrismaClient } from "@/server/db";

export type KnowledgeEditorItem = BusinessContextRecord & {
  sortOrder: number;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  archivedAt: Date | null;
  updatedBy: { name: string | null; email: string } | null;
  revisionCount: number;
};

export async function getKnowledgeEditorData(input: {
  organizationId: string;
  selectedSection?: string;
  selectedItemId?: string;
}) {
  const prisma = getPrismaClient();
  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: input.organizationId },
    select: {
      id: true,
      name: true,
      websiteUrl: true,
      primaryMarket: true,
      defaultLocale: true,
      languageMode: true,
    },
  });
  const rows = await prisma.businessContextItem.findMany({
    where: {
      organizationId: input.organizationId,
      status: { not: "ARCHIVED" },
    },
    include: {
      updatedBy: { select: { name: true, email: true } },
      _count: { select: { revisions: true } },
    },
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  const items = rows.map(mapKnowledgeItem);
  const selectedItem =
    items.find((item) => item.id === input.selectedItemId) ?? null;
  const contextBundle = assembleBusinessContextBundle({
    workspace: {
      name: organization.name,
      websiteUrl: organization.websiteUrl,
      primaryMarket: organization.primaryMarket,
      defaultLocale: organization.defaultLocale,
      languageMode: organization.languageMode,
    },
    items,
  });

  return {
    organization,
    items,
    selectedItem,
    selectedSection:
      (input.selectedSection as BusinessContextSectionValue | undefined) ??
      selectedItem?.section ??
      "BUSINESS_PROFILE",
    contextBundle,
  };
}

function mapKnowledgeItem(row: {
  id: string;
  section: string;
  locale: string | null;
  title: string;
  rawText: string;
  normalizedText: string;
  structuredData: Prisma.JsonValue;
  status: string;
  sortOrder: number;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  archivedAt: Date | null;
  updatedBy: { name: string | null; email: string } | null;
  _count: { revisions: number };
}): KnowledgeEditorItem {
  return {
    id: row.id,
    section: row.section as BusinessContextSectionValue,
    locale: row.locale as "EN" | "EL" | null,
    title: row.title,
    rawText: row.rawText,
    normalizedText: row.normalizedText,
    structuredData: toObject(row.structuredData),
    status: row.status as PublicationStatusValue,
    sortOrder: row.sortOrder,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
    updatedBy: row.updatedBy,
    revisionCount: row._count.revisions,
  };
}

function toObject(value: Prisma.JsonValue) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

import { Prisma } from "@/generated/prisma/client";
import {
  defaultQualificationPlaybook,
  parsePlaybookConfig,
  serializePlaybookConfig,
} from "@/lib/conversation-engine/playbook";
import type {
  LeadFieldKey,
  QualificationPlaybookDefinition,
} from "@/lib/conversation-engine/types";
import { getPrismaClient } from "@/server/db";

export type RuntimePlaybook = {
  id: string;
  definition: QualificationPlaybookDefinition;
  questionIdsByField: Map<LeadFieldKey, string>;
};

export async function ensureDefaultQualificationPlaybook(input: {
  organizationId: string;
  prisma?: ReturnType<typeof getPrismaClient>;
}): Promise<RuntimePlaybook> {
  const prisma = input.prisma ?? getPrismaClient();
  const existing = await prisma.qualificationPlaybook.findFirst({
    where: {
      organizationId: input.organizationId,
      isDefault: true,
      isActive: true,
    },
    include: { questions: { orderBy: { priority: "asc" } } },
  });

  if (existing) {
    return {
      id: existing.id,
      definition: {
        ...parsePlaybookConfig(existing.config),
        questions: existing.questions.length
          ? existing.questions.map((question) => ({
              field: question.fieldKey as LeadFieldKey,
              label: question.label,
              required: question.isRequired,
              priority: question.priority,
              prompt:
                defaultQualificationPlaybook.questions.find(
                  (item) => item.field === question.fieldKey,
                )?.prompt ?? {
                  EN: question.label,
                  EL: question.label,
                },
            }))
          : parsePlaybookConfig(existing.config).questions,
      },
      questionIdsByField: new Map(
        existing.questions.map((question) => [
          question.fieldKey as LeadFieldKey,
          question.id,
        ]),
      ),
    };
  }

  const created = await prisma.qualificationPlaybook.create({
    data: {
      organizationId: input.organizationId,
      name: defaultQualificationPlaybook.name,
      description:
        "Default generic playbook for inbound lead capture, qualification, booking, and handoff.",
      isDefault: true,
      isActive: true,
      version: defaultQualificationPlaybook.version,
      config: toJson(serializePlaybookConfig(defaultQualificationPlaybook)),
      questions: {
        create: defaultQualificationPlaybook.questions.map((question) => ({
          label: question.label,
          fieldKey: question.field,
          priority: question.priority,
          isRequired: question.required,
        })),
      },
    },
    include: { questions: true },
  });

  return {
    id: created.id,
    definition: defaultQualificationPlaybook,
    questionIdsByField: new Map(
      created.questions.map((question) => [
        question.fieldKey as LeadFieldKey,
        question.id,
      ]),
    ),
  };
}

function toJson(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}

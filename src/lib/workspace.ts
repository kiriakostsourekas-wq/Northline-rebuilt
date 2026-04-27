import { randomBytes } from "node:crypto";
import { getPrismaClient } from "@/server/db";

export function createWorkspaceSlug(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  const suffix = randomBytes(3).toString("hex");
  return `${base || "workspace"}-${suffix}`;
}

export async function createWorkspaceForOwner(input: {
  name: string;
  ownerName: string;
  ownerEmail: string;
  passwordHash: string;
}) {
  const prisma = getPrismaClient();
  const slug = createWorkspaceSlug(input.name);

  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: input.name,
        slug,
        billingEmail: input.ownerEmail,
        onboarding: {
          create: {},
        },
      },
    });

    const user = await tx.user.create({
      data: {
        organizationId: organization.id,
        email: input.ownerEmail,
        name: input.ownerName,
        passwordHash: input.passwordHash,
        role: "OWNER",
      },
    });

    return { organization, user };
  });
}

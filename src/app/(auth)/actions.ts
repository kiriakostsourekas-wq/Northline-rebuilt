"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { createSession, hashSessionToken } from "@/lib/auth/session";
import {
  hashPassword,
  validatePassword,
  verifyPassword,
} from "@/lib/auth/password";
import { getOnboardingStepByEnum } from "@/lib/onboarding";
import { createWorkspaceForOwner } from "@/lib/workspace";
import { getPrismaClient } from "@/server/db";
import { rateLimitByRequest } from "@/lib/security/request";
import { writeAuditLog } from "@/server/audit/service";

export async function signUpAction(formData: FormData) {
  const rateLimit = await rateLimitByRequest({
    scope: "auth:sign-up",
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) {
    redirectWithError("/sign-up", "Too many sign-up attempts. Try again later.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const company = String(formData.get("company") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordError = validatePassword(password);

  if (name.length < 2) redirectWithError("/sign-up", "Enter your name.");
  if (!isEmail(email)) redirectWithError("/sign-up", "Enter a valid email.");
  if (company.length < 2) {
    redirectWithError("/sign-up", "Enter your workspace name.");
  }
  if (passwordError) redirectWithError("/sign-up", passwordError);

  const prisma = getPrismaClient();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    redirectWithError("/sign-up", "An account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);
  const { organization, user } = await createWorkspaceForOwner({
    name: company,
    ownerName: name,
    ownerEmail: email,
    passwordHash,
  });

  await writeAuditLog({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "WORKSPACE_CREATED",
    targetType: "Organization",
    targetId: organization.id,
    metadata: { source: "sign_up" },
  });
  await createSession(user.id);
  redirect("/app/onboarding/business-basics");
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rateLimit = await rateLimitByRequest({
    scope: "auth:sign-in",
    limit: 8,
    windowMs: 15 * 60 * 1000,
    discriminator: email,
  });
  if (!rateLimit.allowed) {
    redirectWithError("/sign-in", "Too many sign-in attempts. Try again later.");
  }

  if (!isEmail(email) || !password) {
    redirectWithError("/sign-in", "Enter your email and password.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirectWithError("/sign-in", "Invalid email or password.");
  }

  await createSession(user.id);
  await writeAuditLog({
    organizationId: user.organizationId,
    actorUserId: user.id,
    action: "AUTH_SIGN_IN",
    targetType: "User",
    targetId: user.id,
    metadata: { method: "password" },
  });

  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    include: { onboarding: true },
  });

  if (!organization?.onboarding?.completedAt) {
    const resumeStep = organization?.onboarding?.currentStep
      ? getOnboardingStepByEnum(organization.onboarding.currentStep)
      : null;

    redirect(`/app/onboarding/${resumeStep?.slug ?? "business-basics"}`);
  }

  redirect("/app/dashboard");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rateLimit = await rateLimitByRequest({
    scope: "auth:password-reset",
    limit: 5,
    windowMs: 60 * 60 * 1000,
    discriminator: email,
  });

  if (!rateLimit.allowed) {
    redirect("/reset-password?sent=1");
  }

  if (isEmail(email)) {
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = randomBytes(32).toString("base64url");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashSessionToken(token),
          expiresAt: new Date(Date.now() + 1000 * 60 * 30),
        },
      });
      await writeAuditLog({
        organizationId: user.organizationId,
        actorUserId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        targetType: "User",
        targetId: user.id,
        metadata: { delivery: "not_configured_preview" },
      });
    }
  }

  redirect("/reset-password?sent=1");
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

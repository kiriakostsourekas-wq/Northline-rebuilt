"use server";

import { redirect } from "next/navigation";
import {
  getNextOnboardingStep,
  getOnboardingStep,
  isChannelOption,
  isLeadFieldOption,
  isWorkspaceLanguage,
  parseMultiSelect,
  type OnboardingStepSlug,
} from "@/lib/onboarding";
import { requireCurrentUser } from "@/lib/auth/guards";
import { writeAuditLog } from "@/server/audit/service";
import { getPrismaClient } from "@/server/db";

const bookingModes = new Set(["suggest_slots", "send_link", "handoff"]);
const destinationModes = new Set([
  "none_yet",
  "spreadsheet",
  "hubspot",
  "pipedrive",
  "webhook",
]);

export async function saveOnboardingStep(formData: FormData) {
  const stepSlug = String(formData.get("step") ?? "");
  const step = getOnboardingStep(stepSlug);

  if (!step) {
    redirect("/app/onboarding/business-basics?error=Unknown onboarding step.");
  }

  const { organization, user } = await requireCurrentUser();
  const prisma = getPrismaClient();
  const nextStep = getNextOnboardingStep(step.slug as OnboardingStepSlug);
  const currentStep = nextStep?.enumValue ?? "COMPLETE";

  if (step.slug === "business-basics") {
    const businessName = getRequiredString(formData, "businessName");
    const websiteUrl = getOptionalString(formData, "websiteUrl");
    const country = getOptionalString(formData, "country") || "Greece";
    const timezone = getOptionalString(formData, "timezone") || "Europe/Athens";

    if (!businessName) {
      redirectWithStepError(step.slug, "Enter a business name.");
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        name: businessName,
        websiteUrl,
        primaryMarket: country,
        onboarding: {
          upsert: {
            create: {
              currentStep,
              businessBasics: { businessName, websiteUrl, country, timezone },
            },
            update: {
              currentStep,
              businessBasics: { businessName, websiteUrl, country, timezone },
            },
          },
        },
      },
    });
  }

  if (step.slug === "languages") {
    const languageMode = String(formData.get("languageMode") ?? "");

    if (!isWorkspaceLanguage(languageMode)) {
      redirectWithStepError(step.slug, "Choose a language preference.");
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        languageMode,
        defaultLocale: languageMode === "GREEK" ? "EL" : "EN",
        onboarding: {
          upsert: {
            create: { currentStep, languageMode },
            update: { currentStep, languageMode },
          },
        },
      },
    });
  }

  if (step.slug === "description") {
    const description = getRequiredString(formData, "businessDescription");

    if (!description || description.length < 20) {
      redirectWithStepError(
        step.slug,
        "Add a short description with at least 20 characters.",
      );
    }

    await prisma.onboardingState.upsert({
      where: { organizationId: organization.id },
      create: {
        organizationId: organization.id,
        currentStep,
        businessDescription: description,
      },
      update: {
        currentStep,
        businessDescription: description,
      },
    });
  }

  if (step.slug === "channels") {
    const desiredChannels = parseMultiSelect(formData, "channels").filter(
      isChannelOption,
    );

    if (desiredChannels.length === 0) {
      redirectWithStepError(step.slug, "Choose at least one channel.");
    }

    await prisma.onboardingState.upsert({
      where: { organizationId: organization.id },
      create: {
        organizationId: organization.id,
        currentStep,
        desiredChannels,
      },
      update: {
        currentStep,
        desiredChannels,
      },
    });
  }

  if (step.slug === "lead-fields") {
    const leadFields = parseMultiSelect(formData, "leadFields").filter(
      isLeadFieldOption,
    );

    if (leadFields.length === 0) {
      redirectWithStepError(step.slug, "Choose at least one lead field.");
    }

    await prisma.onboardingState.upsert({
      where: { organizationId: organization.id },
      create: {
        organizationId: organization.id,
        currentStep,
        leadFields,
      },
      update: {
        currentStep,
        leadFields,
      },
    });
  }

  if (step.slug === "booking") {
    const bookingMode = getRequiredString(formData, "bookingMode");
    const schedulingLink = getOptionalString(formData, "schedulingLink");
    const handoffOwner = getOptionalString(formData, "handoffOwner");

    if (!bookingModes.has(bookingMode)) {
      redirectWithStepError(step.slug, "Choose a booking preference.");
    }

    await prisma.onboardingState.upsert({
      where: { organizationId: organization.id },
      create: {
        organizationId: organization.id,
        currentStep,
        bookingPreferences: { bookingMode, schedulingLink, handoffOwner },
      },
      update: {
        currentStep,
        bookingPreferences: { bookingMode, schedulingLink, handoffOwner },
      },
    });
  }

  if (step.slug === "integrations") {
    const crm = getRequiredString(formData, "crm");
    const webhookUrl = getOptionalString(formData, "webhookUrl");

    if (!destinationModes.has(crm)) {
      redirectWithStepError(step.slug, "Choose a destination preference.");
    }

    await prisma.onboardingState.upsert({
      where: { organizationId: organization.id },
      create: {
        organizationId: organization.id,
        currentStep,
        integrationPreference: { crm, webhookUrl },
      },
      update: {
        currentStep,
        integrationPreference: { crm, webhookUrl },
      },
    });
  }

  if (step.slug === "review") {
    await prisma.onboardingState.upsert({
      where: { organizationId: organization.id },
      create: {
        organizationId: organization.id,
        currentStep: "COMPLETE",
        completedAt: new Date(),
      },
      update: {
        currentStep: "COMPLETE",
        completedAt: new Date(),
      },
    });
    await writeAuditLog({
      organizationId: organization.id,
      actorUserId: user.id,
      action: "ONBOARDING_COMPLETED",
      targetType: "OnboardingState",
      targetId: organization.id,
    });

    redirect("/app/dashboard");
  }

  if (!nextStep) {
    redirect("/app/dashboard");
  }

  await writeAuditLog({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "ONBOARDING_STEP_SAVED",
    targetType: "OnboardingState",
    targetId: organization.id,
    metadata: { step: step.slug, nextStep: nextStep.slug },
  });

  redirect(`/app/onboarding/${nextStep.slug}`);
}

function getRequiredString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function redirectWithStepError(step: string, message: string): never {
  redirect(`/app/onboarding/${step}?error=${encodeURIComponent(message)}`);
}

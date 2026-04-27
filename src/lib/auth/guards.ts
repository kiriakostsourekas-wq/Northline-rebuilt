import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { getOnboardingStepByEnum } from "@/lib/onboarding";

export async function requireCurrentUser() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/sign-in");
  }

  return {
    session,
    user: session.user,
    organization: session.user.organization,
  };
}

export async function requireCompletedOnboarding() {
  const context = await requireCurrentUser();

  if (!context.organization.onboarding?.completedAt) {
    const resumeStep = context.organization.onboarding?.currentStep
      ? getOnboardingStepByEnum(context.organization.onboarding.currentStep)
      : null;

    redirect(`/app/onboarding/${resumeStep?.slug ?? "business-basics"}`);
  }

  return context;
}

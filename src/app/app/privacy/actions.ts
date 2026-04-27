"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCompletedOnboarding } from "@/lib/auth/guards";
import { anonymizeLeadPersonalData } from "@/server/privacy/data-subject";

export async function anonymizeLeadAction(formData: FormData) {
  const { organization, user } = await requirePrivacyManager();
  const leadId = getRequiredString(formData, "leadId");

  await anonymizeLeadPersonalData({
    organizationId: organization.id,
    leadId,
    actorUserId: user.id,
  });

  revalidatePath("/app/privacy");
  redirect("/app/privacy?deleted=1");
}

async function requirePrivacyManager() {
  const context = await requireCompletedOnboarding();
  if (context.user.role !== "OWNER" && context.user.role !== "ADMIN") {
    redirect("/app/dashboard?error=Only owners and admins can manage privacy.");
  }
  return context;
}

function getRequiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

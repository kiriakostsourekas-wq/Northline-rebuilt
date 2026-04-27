export const onboardingSteps = [
  {
    slug: "business-basics",
    enumValue: "BUSINESS_BASICS",
    title: "Business basics",
    description: "Start with the public details your leads already know.",
  },
  {
    slug: "languages",
    enumValue: "LANGUAGES",
    title: "Language preferences",
    description: "Choose how Northline should handle Greek and English.",
  },
  {
    slug: "description",
    enumValue: "DESCRIPTION",
    title: "Business description",
    description: "Describe what your business sells and who it helps.",
  },
  {
    slug: "channels",
    enumValue: "CHANNELS",
    title: "Lead channels",
    description: "Select where inbound conversations usually start.",
  },
  {
    slug: "lead-fields",
    enumValue: "LEAD_FIELDS",
    title: "Lead fields",
    description: "Pick the details Northline should collect before handoff.",
  },
  {
    slug: "booking",
    enumValue: "BOOKING",
    title: "Booking preferences",
    description: "Tell Northline how appointments or meetings should work.",
  },
  {
    slug: "integrations",
    enumValue: "INTEGRATIONS",
    title: "CRM and webhook",
    description: "Choose where qualified lead data should go later.",
  },
  {
    slug: "review",
    enumValue: "REVIEW",
    title: "Review and finish",
    description: "Confirm the workspace setup before opening the dashboard.",
  },
] as const;

export type OnboardingStepSlug = (typeof onboardingSteps)[number]["slug"];
export type OnboardingStepEnum = (typeof onboardingSteps)[number]["enumValue"];

export const languageOptions = [
  { value: "GREEK", label: "Greek" },
  { value: "ENGLISH", label: "English" },
  { value: "BILINGUAL", label: "Bilingual" },
] as const;

export const channelOptions = [
  { value: "WEBSITE_CHAT", label: "Website chat" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK_MESSENGER", label: "Facebook Messenger" },
  { value: "VIBER", label: "Viber" },
  { value: "EMAIL", label: "Email" },
  { value: "API", label: "API intake" },
] as const;

export const leadFieldOptions = [
  "Name",
  "Email",
  "Phone",
  "Company",
  "Service interest",
  "Budget range",
  "Location",
  "Preferred meeting time",
] as const;

export type WorkspaceLanguageOptionValue =
  (typeof languageOptions)[number]["value"];
export type ChannelOptionValue = (typeof channelOptions)[number]["value"];
export type LeadFieldOptionValue = (typeof leadFieldOptions)[number];

export function getOnboardingStep(slug: string) {
  return onboardingSteps.find((step) => step.slug === slug) ?? null;
}

export function getOnboardingStepByEnum(enumValue: string) {
  return onboardingSteps.find((step) => step.enumValue === enumValue) ?? null;
}

export function getNextOnboardingStep(slug: OnboardingStepSlug) {
  const index = onboardingSteps.findIndex((step) => step.slug === slug);
  return onboardingSteps[index + 1] ?? null;
}

export function getPreviousOnboardingStep(slug: OnboardingStepSlug) {
  const index = onboardingSteps.findIndex((step) => step.slug === slug);
  return index > 0 ? onboardingSteps[index - 1] : null;
}

export function getOnboardingProgress(slug: OnboardingStepSlug) {
  const index = onboardingSteps.findIndex((step) => step.slug === slug);
  return {
    current: index + 1,
    total: onboardingSteps.length,
    percent: Math.round(((index + 1) / onboardingSteps.length) * 100),
  };
}

export function parseMultiSelect(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .map((value) => String(value))
    .filter(Boolean);
}

export function isWorkspaceLanguage(
  value: string,
): value is WorkspaceLanguageOptionValue {
  return languageOptions.some((option) => option.value === value);
}

export function isChannelOption(value: string): value is ChannelOptionValue {
  return channelOptions.some((option) => option.value === value);
}

export function isLeadFieldOption(
  value: string,
): value is LeadFieldOptionValue {
  return leadFieldOptions.some((option) => option === value);
}

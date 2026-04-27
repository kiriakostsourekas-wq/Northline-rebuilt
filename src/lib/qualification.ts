import type { Locale } from "@/content/marketing";

export type LeadChannel =
  | "website_chat"
  | "whatsapp"
  | "instagram"
  | "facebook_messenger"
  | "viber"
  | "email"
  | "api";

export type LeadUrgency = "immediate" | "this_week" | "this_month" | "exploring";

export type BusinessFit = "strong" | "unclear" | "poor";

export type LeadStage =
  | "sales_ready"
  | "qualified"
  | "nurture"
  | "needs_human_review"
  | "disqualified";

export type QualificationInput = {
  consentToContact: boolean;
  channel: LeadChannel;
  message: string;
  requestedBooking?: boolean;
  budgetConfirmed?: boolean;
  locationMatched?: boolean;
  businessFit: BusinessFit;
  urgency: LeadUrgency;
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    preferredLanguage?: Locale;
  };
};

export type QualificationResult = {
  score: number;
  stage: LeadStage;
  missingFields: string[];
  recommendedActions: string[];
};

const urgencyScore: Record<LeadUrgency, number> = {
  immediate: 24,
  this_week: 18,
  this_month: 10,
  exploring: 4,
};

const fitScore: Record<BusinessFit, number> = {
  strong: 24,
  unclear: 8,
  poor: -20,
};

const messagingChannels = new Set<LeadChannel>([
  "website_chat",
  "whatsapp",
  "instagram",
  "facebook_messenger",
  "viber",
]);

export function qualifyLead(input: QualificationInput): QualificationResult {
  const missingFields = collectMissingFields(input);

  if (!input.consentToContact) {
    return {
      score: 0,
      stage: "needs_human_review",
      missingFields,
      recommendedActions: [
        "Ask for explicit contact consent before sales outreach.",
        "Keep the thread available for a human review if the lead keeps engaging.",
      ],
    };
  }

  if (input.businessFit === "poor") {
    return {
      score: 10,
      stage: "disqualified",
      missingFields,
      recommendedActions: [
        "Politely explain the mismatch and offer a relevant alternative if available.",
      ],
    };
  }

  let score = 0;
  score += fitScore[input.businessFit];
  score += urgencyScore[input.urgency];
  score += input.requestedBooking ? 18 : 0;
  score += input.budgetConfirmed ? 10 : 0;
  score += input.locationMatched ? 10 : 0;
  score += hasContactMethod(input) ? 14 : 0;
  score += input.contact.name ? 4 : 0;
  score += input.message.trim().length >= 40 ? 8 : 3;
  score += messagingChannels.has(input.channel) ? 4 : 0;

  const normalizedScore = clamp(score, 0, 100);

  return {
    score: normalizedScore,
    stage: stageFromScore(normalizedScore, missingFields),
    missingFields,
    recommendedActions: buildRecommendedActions(input, normalizedScore),
  };
}

function collectMissingFields(input: QualificationInput) {
  const missingFields: string[] = [];

  if (!input.consentToContact) missingFields.push("contact_consent");
  if (!input.contact.name) missingFields.push("lead_name");
  if (!hasContactMethod(input)) missingFields.push("contact_method");
  if (input.businessFit === "unclear") missingFields.push("business_fit");
  if (!input.locationMatched) missingFields.push("service_location");

  return missingFields;
}

function hasContactMethod(input: QualificationInput) {
  return Boolean(input.contact.email || input.contact.phone);
}

function stageFromScore(score: number, missingFields: string[]): LeadStage {
  if (score >= 82 && missingFields.length === 0) return "sales_ready";
  if (score >= 62 && !missingFields.includes("contact_method")) return "qualified";
  if (score >= 35) return "nurture";

  return "needs_human_review";
}

function buildRecommendedActions(
  input: QualificationInput,
  score: number,
): string[] {
  const actions: string[] = [];

  if (input.contact.preferredLanguage === "el") {
    actions.push("Continue qualification in Greek.");
  }

  if (!hasContactMethod(input)) {
    actions.push("Collect an email or phone number before routing to sales.");
  }

  if (!input.locationMatched) {
    actions.push("Confirm the lead is inside the business service area.");
  }

  if (input.businessFit === "unclear") {
    actions.push("Ask one fit question from the active qualification playbook.");
  }

  if (score >= 82) {
    actions.push("Offer a booking slot or route directly to the sales owner.");
  } else if (score >= 62) {
    actions.push("Route to sales with missing context clearly marked.");
  } else {
    actions.push("Keep the lead in nurture until intent or fit improves.");
  }

  return actions;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

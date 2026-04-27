export const interestTypes = ["demo", "waitlist", "contact"] as const;

export type InterestType = (typeof interestTypes)[number];

export type InterestSubmission = {
  type: InterestType;
  name: string;
  email: string;
  company: string;
  website?: string;
  country?: string;
  teamSize?: string;
  message?: string;
  consent: boolean;
};

export type InterestValidationResult =
  | { ok: true; data: InterestSubmission }
  | {
      ok: false;
      message: string;
      fieldErrors: Partial<Record<keyof InterestSubmission, string>>;
    };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInterestSubmission(
  input: Record<string, unknown>,
): InterestValidationResult {
  const fieldErrors: Partial<Record<keyof InterestSubmission, string>> = {};
  const type = normalizeString(input.type);
  const name = normalizeString(input.name);
  const email = normalizeString(input.email);
  const company = normalizeString(input.company);
  const website = normalizeString(input.website);
  const country = normalizeString(input.country);
  const teamSize = normalizeString(input.teamSize);
  const message = normalizeString(input.message);
  const consent = input.consent === true || input.consent === "true";
  const interestType: InterestType | null = isInterestType(type) ? type : null;

  if (!interestType) {
    fieldErrors.type = "Choose a valid request type.";
  }

  if (name.length < 2) {
    fieldErrors.name = "Enter your name.";
  }

  if (!emailPattern.test(email)) {
    fieldErrors.email = "Enter a valid work email.";
  }

  if (company.length < 2) {
    fieldErrors.company = "Enter your company name.";
  }

  if (website && !isLikelyUrl(website)) {
    fieldErrors.website = "Enter a valid website URL.";
  }

  if (!consent) {
    fieldErrors.consent = "Consent is required so we can reply.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  if (!interestType) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        type: "Choose a valid request type.",
      },
    };
  }

  return {
    ok: true,
    data: {
      type: interestType,
      name,
      email,
      company,
      website: website || undefined,
      country: country || undefined,
      teamSize: teamSize || undefined,
      message: message || undefined,
      consent,
    },
  };
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isInterestType(value: string): value is InterestType {
  return interestTypes.includes(value as InterestType);
}

function isLikelyUrl(value: string) {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return Boolean(url.hostname.includes("."));
  } catch {
    return false;
  }
}

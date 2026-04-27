import { describe, expect, it } from "vitest";
import { validateInterestSubmission } from "./interest";

describe("validateInterestSubmission", () => {
  it("accepts a complete demo request", () => {
    const result = validateInterestSubmission({
      type: "demo",
      name: "Maria",
      email: "maria@example.com",
      company: "Athens Clinic",
      website: "athensclinic.gr",
      consent: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.type).toBe("demo");
      expect(result.data.website).toBe("athensclinic.gr");
    }
  });

  it("rejects invalid email and missing consent", () => {
    const result = validateInterestSubmission({
      type: "waitlist",
      name: "Nikos",
      email: "not-an-email",
      company: "Local Services",
      consent: false,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.email).toBe("Enter a valid work email.");
      expect(result.fieldErrors.consent).toBe(
        "Consent is required so we can reply.",
      );
    }
  });
});

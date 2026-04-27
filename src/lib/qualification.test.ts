import { describe, expect, it } from "vitest";
import { qualifyLead, type QualificationInput } from "./qualification";

const baseLead: QualificationInput = {
  consentToContact: true,
  channel: "website_chat",
  message:
    "We need pricing and availability for a sales consultation this week for our Athens office.",
  requestedBooking: false,
  budgetConfirmed: false,
  locationMatched: true,
  businessFit: "strong",
  urgency: "this_week",
  contact: {
    name: "Maria K.",
    email: "maria@example.com",
    preferredLanguage: "en",
  },
};

describe("qualifyLead", () => {
  it("marks a high-intent booking request as sales-ready", () => {
    const result = qualifyLead({
      ...baseLead,
      requestedBooking: true,
      budgetConfirmed: true,
      urgency: "immediate",
    });

    expect(result.score).toBeGreaterThanOrEqual(82);
    expect(result.stage).toBe("sales_ready");
    expect(result.missingFields).toEqual([]);
    expect(result.recommendedActions).toContain(
      "Offer a booking slot or route directly to the sales owner.",
    );
  });

  it("requires explicit consent before sales outreach", () => {
    const result = qualifyLead({
      ...baseLead,
      consentToContact: false,
    });

    expect(result.score).toBe(0);
    expect(result.stage).toBe("needs_human_review");
    expect(result.missingFields).toContain("contact_consent");
    expect(result.recommendedActions[0]).toMatch(/explicit contact consent/);
  });

  it("routes low-context leads to human review when contact details are missing", () => {
    const result = qualifyLead({
      ...baseLead,
      businessFit: "unclear",
      locationMatched: false,
      contact: {
        preferredLanguage: "el",
      },
      message: "Need info.",
      urgency: "exploring",
    });

    expect(result.stage).toBe("needs_human_review");
    expect(result.missingFields).toEqual([
      "lead_name",
      "contact_method",
      "business_fit",
      "service_location",
    ]);
    expect(result.recommendedActions).toContain("Continue qualification in Greek.");
    expect(result.recommendedActions).toContain(
      "Collect an email or phone number before routing to sales.",
    );
  });

  it("disqualifies a lead that is outside the business fit", () => {
    const result = qualifyLead({
      ...baseLead,
      businessFit: "poor",
    });

    expect(result.stage).toBe("disqualified");
    expect(result.score).toBe(10);
    expect(result.recommendedActions[0]).toMatch(/mismatch/);
  });
});

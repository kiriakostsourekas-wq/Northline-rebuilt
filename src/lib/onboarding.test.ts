import { describe, expect, it } from "vitest";
import {
  getNextOnboardingStep,
  getOnboardingStepByEnum,
  getOnboardingProgress,
  getPreviousOnboardingStep,
  onboardingSteps,
} from "./onboarding";

describe("onboarding flow", () => {
  it("keeps the required step order", () => {
    expect(onboardingSteps.map((step) => step.slug)).toEqual([
      "business-basics",
      "languages",
      "description",
      "channels",
      "lead-fields",
      "booking",
      "integrations",
      "review",
    ]);
  });

  it("calculates next, previous, and progress", () => {
    expect(getNextOnboardingStep("business-basics")?.slug).toBe("languages");
    expect(getPreviousOnboardingStep("channels")?.slug).toBe("description");
    expect(getOnboardingStepByEnum("BOOKING")?.slug).toBe("booking");
    expect(getOnboardingProgress("review")).toEqual({
      current: 8,
      total: 8,
      percent: 100,
    });
  });
});

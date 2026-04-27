import { describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimitStore } from "@/lib/security/rate-limit";

describe("rate limit utility", () => {
  it("allows requests until the configured limit is reached", () => {
    resetRateLimitStore();

    expect(
      checkRateLimit({ key: "sign-in:1", limit: 2, windowMs: 1000, now: 100 }),
    ).toMatchObject({ allowed: true, remaining: 1 });
    expect(
      checkRateLimit({ key: "sign-in:1", limit: 2, windowMs: 1000, now: 200 }),
    ).toMatchObject({ allowed: true, remaining: 0 });
    expect(
      checkRateLimit({ key: "sign-in:1", limit: 2, windowMs: 1000, now: 300 }),
    ).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("resets buckets after the window expires", () => {
    resetRateLimitStore();

    checkRateLimit({ key: "api:1", limit: 1, windowMs: 1000, now: 100 });
    expect(
      checkRateLimit({ key: "api:1", limit: 1, windowMs: 1000, now: 200 }),
    ).toMatchObject({ allowed: false });
    expect(
      checkRateLimit({ key: "api:1", limit: 1, windowMs: 1000, now: 1200 }),
    ).toMatchObject({ allowed: true, remaining: 0 });
  });
});

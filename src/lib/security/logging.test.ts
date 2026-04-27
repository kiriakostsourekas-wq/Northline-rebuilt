import { describe, expect, it } from "vitest";
import { safeErrorMessage, sanitizeLogValue } from "@/lib/security/logging";

describe("security logging helpers", () => {
  it("redacts common personal and secret values", () => {
    expect(
      sanitizeLogValue({
        email: "maria@example.com",
        message: "Call +30 690 123 4567 using token=abc123",
        nested: { apiKey: "secret-value" },
      }),
    ).toEqual({
      email: "[redacted]",
      message: "Call [redacted] using token=[redacted]",
      nested: { apiKey: "[redacted]" },
    });
  });

  it("returns bounded safe error text", () => {
    expect(
      safeErrorMessage(
        new Error("Webhook failed for nikos@example.com with secret=topsecret"),
      ),
    ).toBe("Webhook failed for [redacted] with secret=[redacted]");
  });
});

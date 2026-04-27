import { describe, expect, it } from "vitest";
import { hashPassword, validatePassword, verifyPassword } from "./password";

describe("password utilities", () => {
  it("hashes and verifies valid passwords", async () => {
    const hash = await hashPassword("Northline2026");

    expect(hash).not.toContain("Northline2026");
    await expect(verifyPassword("Northline2026", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("requires enough entropy for local account passwords", () => {
    expect(validatePassword("short1")).toBe("Use at least 8 characters.");
    expect(validatePassword("abcdefgh")).toBe(
      "Use at least one letter and one number.",
    );
    expect(validatePassword("northline1")).toBeNull();
  });
});

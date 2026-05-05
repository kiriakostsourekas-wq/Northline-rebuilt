import { describe, expect, it } from "vitest";
import { buildHealthPayload, getEnvironmentHealth } from "@/lib/health";

describe("health readiness helpers", () => {
  it("requires only core runtime vars outside strict production", () => {
    const health = getEnvironmentHealth({
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
      DATABASE_URL: "postgresql://preview",
      NEXT_PUBLIC_APP_URL: "https://preview.example.com",
    });

    expect(health.ok).toBe(true);
    expect(health.strictProduction).toBe(false);
    expect(health.missing).toEqual([]);
  });

  it("requires signing and encryption secrets in strict production", () => {
    const health = getEnvironmentHealth({
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      DATABASE_URL: "postgresql://prod",
      NEXT_PUBLIC_APP_URL: "https://example.com",
    });

    expect(health.ok).toBe(false);
    expect(health.strictProduction).toBe(true);
    expect(health.missing).toEqual([
      "NORTHLINE_SECRET_ENCRYPTION_KEY",
      "NORTHLINE_WEBSITE_CHAT_SECRET",
    ]);
  });

  it("treats invalid public app URLs as missing", () => {
    const health = getEnvironmentHealth({
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      DATABASE_URL: "postgresql://prod",
      NEXT_PUBLIC_APP_URL: "https://<future-production-domain>",
      NORTHLINE_SECRET_ENCRYPTION_KEY: "secret",
      NORTHLINE_WEBSITE_CHAT_SECRET: "secret",
    });

    expect(health.ok).toBe(false);
    expect(health.missing).toEqual(["NEXT_PUBLIC_APP_URL"]);
  });

  it("marks the service degraded when any readiness check fails", () => {
    const payload = buildHealthPayload({
      now: new Date("2026-04-26T12:00:00.000Z"),
      uptimeSeconds: 12,
      environment: {
        ok: true,
        environment: "preview",
        strictProduction: false,
        missing: [],
      },
      database: { ok: false, latencyMs: null },
    });

    expect(payload.status).toBe("degraded");
    expect(payload.checks.database.ok).toBe(false);
  });
});

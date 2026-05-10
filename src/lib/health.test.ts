import { describe, expect, it } from "vitest";
import {
  buildDatabaseHealth,
  buildHealthPayload,
  getEnvironmentHealth,
} from "@/lib/health";

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
      database: buildDatabaseHealth({
        reachable: false,
        latencyMs: null,
      }),
    });

    expect(payload.status).toBe("degraded");
    expect(payload.checks.database.ok).toBe(false);
  });

  it("does not treat a reachable database as ready when Prisma schema is missing", () => {
    const database = buildDatabaseHealth({
      reachable: true,
      latencyMs: 18,
      migrationsTableExists: false,
      appliedMigrationCount: null,
      failedMigrationCount: null,
      expectedTables: {
        Organization: false,
        User: false,
        Session: false,
      },
    });

    expect(database.ok).toBe(false);
    expect(database.reachable).toBe(true);
    expect(database.schemaReady).toBe(false);
    expect(database.migrationsReady).toBe(false);
    expect(database.migrationsTable).toBe("missing");
    expect(database.missingTables).toEqual(["Organization", "Session", "User"]);
  });

  it("marks migrations as not ready when failed migrations are recorded", () => {
    const database = buildDatabaseHealth({
      reachable: true,
      latencyMs: 24,
      migrationsTableExists: true,
      appliedMigrationCount: 0,
      failedMigrationCount: 1,
      expectedTables: {
        Organization: true,
        User: true,
        Session: true,
      },
    });

    expect(database.ok).toBe(false);
    expect(database.schemaReady).toBe(true);
    expect(database.migrationsReady).toBe(false);
    expect(database.failedMigrationCount).toBe(1);
  });

  it("marks database readiness ok only when schema and migrations are ready", () => {
    const database = buildDatabaseHealth({
      reachable: true,
      latencyMs: 12,
      migrationsTableExists: true,
      appliedMigrationCount: 11,
      failedMigrationCount: 0,
      expectedTables: {
        Organization: true,
        User: true,
        Session: true,
      },
    });

    expect(database.ok).toBe(true);
    expect(database.schemaReady).toBe(true);
    expect(database.migrationsReady).toBe(true);
    expect(database.missingTables).toEqual([]);
  });
});

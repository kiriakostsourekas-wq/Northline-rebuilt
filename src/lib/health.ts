import { isValidPublicUrl } from "@/lib/app-url";

export type RuntimeEnvironment = "local" | "development" | "preview" | "production";

export type EnvironmentHealth = {
  ok: boolean;
  environment: RuntimeEnvironment;
  missing: string[];
  strictProduction: boolean;
};

export type DatabaseHealth = {
  ok: boolean;
  reachable: boolean;
  latencyMs: number | null;
  schemaReady: boolean;
  migrationsReady: boolean;
  migrationsTable: "present" | "missing" | "unknown";
  appliedMigrationCount: number | null;
  failedMigrationCount: number | null;
  missingTables: string[];
};

export const databaseReadinessTables = [
  "Organization",
  "User",
  "Session",
] as const;

const alwaysRequired = ["DATABASE_URL", "NEXT_PUBLIC_APP_URL"] as const;
const strictProductionRequired = [
  "NORTHLINE_SECRET_ENCRYPTION_KEY",
  "NORTHLINE_WEBSITE_CHAT_SECRET",
] as const;

export function getEnvironmentHealth(
  env: Record<string, string | undefined> = process.env,
): EnvironmentHealth {
  const strictProduction =
    env.NODE_ENV === "production" && env.VERCEL_ENV === "production";
  const required = strictProduction
    ? [...alwaysRequired, ...strictProductionRequired]
    : [...alwaysRequired];
  const missing = required.filter((key) => isMissingRequiredValue(key, env[key]));

  return {
    ok: missing.length === 0,
    environment: getRuntimeEnvironment(env),
    missing,
    strictProduction,
  };
}

function isMissingRequiredValue(key: string, value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) return true;
  if (key === "NEXT_PUBLIC_APP_URL") return !isValidPublicUrl(trimmed);

  return false;
}

export function getRuntimeEnvironment(
  env: Record<string, string | undefined> = process.env,
): RuntimeEnvironment {
  if (env.VERCEL_ENV === "production") return "production";
  if (env.VERCEL_ENV === "preview") return "preview";
  if (env.VERCEL_ENV === "development") return "development";
  if (env.NODE_ENV === "production") return "production";
  if (env.NODE_ENV === "development") return "local";
  return "local";
}

export function buildHealthPayload(input: {
  environment: EnvironmentHealth;
  database: DatabaseHealth;
  now?: Date;
  uptimeSeconds?: number;
}) {
  const ok = input.environment.ok && input.database.ok;
  return {
    status: ok ? "ok" : "degraded",
    service: "northline-rebuild",
    timestamp: (input.now ?? new Date()).toISOString(),
    environment: input.environment.environment,
    uptimeSeconds: input.uptimeSeconds ?? null,
    checks: {
      environment: {
        ok: input.environment.ok,
        strictProduction: input.environment.strictProduction,
        missing: input.environment.missing,
      },
      database: input.database,
    },
  };
}

export function buildDatabaseHealth(input: {
  reachable: boolean;
  latencyMs: number | null;
  migrationsTableExists?: boolean;
  appliedMigrationCount?: number | null;
  failedMigrationCount?: number | null;
  expectedTables?: Record<string, boolean>;
}): DatabaseHealth {
  const expectedTables = input.expectedTables ?? {};
  const missingTables = Object.entries(expectedTables)
    .filter(([, present]) => !present)
    .map(([name]) => name)
    .sort();
  const migrationsTable = input.reachable
    ? input.migrationsTableExists
      ? "present"
      : "missing"
    : "unknown";
  const appliedMigrationCount =
    input.appliedMigrationCount === undefined
      ? null
      : input.appliedMigrationCount;
  const failedMigrationCount =
    input.failedMigrationCount === undefined ? null : input.failedMigrationCount;
  const schemaReady =
    input.reachable &&
    Object.keys(expectedTables).length > 0 &&
    missingTables.length === 0;
  const migrationsReady =
    input.reachable &&
    migrationsTable === "present" &&
    appliedMigrationCount !== null &&
    appliedMigrationCount > 0 &&
    failedMigrationCount === 0;

  return {
    ok: input.reachable && schemaReady && migrationsReady,
    reachable: input.reachable,
    latencyMs: input.latencyMs,
    schemaReady,
    migrationsReady,
    migrationsTable,
    appliedMigrationCount,
    failedMigrationCount,
    missingTables,
  };
}

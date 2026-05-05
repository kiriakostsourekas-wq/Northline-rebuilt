import { isValidPublicUrl } from "@/lib/app-url";

export type RuntimeEnvironment = "local" | "development" | "preview" | "production";

export type EnvironmentHealth = {
  ok: boolean;
  environment: RuntimeEnvironment;
  missing: string[];
  strictProduction: boolean;
};

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
  database: { ok: boolean; latencyMs: number | null };
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

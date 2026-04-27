import { headers } from "next/headers";
import { checkRateLimit, type RateLimitResult } from "@/lib/security/rate-limit";

export async function getRequestIp() {
  const headerStore = await headers();
  return getRequestIpFromHeaders(headerStore);
}

export function getRequestIpFromHeaders(headerStore: Headers) {
  const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    headerStore.get("x-real-ip") ||
    headerStore.get("cf-connecting-ip") ||
    "local"
  );
}

export async function rateLimitByRequest(input: {
  scope: string;
  limit: number;
  windowMs: number;
  discriminator?: string;
}): Promise<RateLimitResult> {
  const ip = await getRequestIp();
  const discriminator = input.discriminator ? `:${input.discriminator}` : "";
  return checkRateLimit({
    key: `${input.scope}:${ip}${discriminator}`,
    limit: input.limit,
    windowMs: input.windowMs,
  });
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
  };
}

import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { buildHealthPayload, getEnvironmentHealth } from "@/lib/health";
import { getPrismaClient } from "@/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const payload = buildHealthPayload({
    environment: getEnvironmentHealth(),
    database: await checkDatabase(),
    uptimeSeconds: Math.round(process.uptime()),
  });
  const status = payload.status === "ok" ? 200 : 503;

  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function HEAD() {
  const database = await checkDatabase();
  const environment = getEnvironmentHealth();
  const status = environment.ok && database.ok ? 200 : 503;

  return new Response(null, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

async function checkDatabase() {
  const startedAt = Date.now();

  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw(Prisma.sql`SELECT 1`);

    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
    };
  } catch {
    return {
      ok: false,
      latencyMs: null,
    };
  }
}

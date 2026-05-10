import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import {
  buildDatabaseHealth,
  buildHealthPayload,
  databaseReadinessTables,
  getEnvironmentHealth,
} from "@/lib/health";
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
    const [schemaState] = await prisma.$queryRaw<
      {
        migrationsTableExists: boolean;
        organizationTableExists: boolean;
        userTableExists: boolean;
        sessionTableExists: boolean;
      }[]
    >(Prisma.sql`
      SELECT
        to_regclass('public._prisma_migrations') IS NOT NULL AS "migrationsTableExists",
        to_regclass('public."Organization"') IS NOT NULL AS "organizationTableExists",
        to_regclass('public."User"') IS NOT NULL AS "userTableExists",
        to_regclass('public."Session"') IS NOT NULL AS "sessionTableExists"
    `);
    const migrationCounts = schemaState?.migrationsTableExists
      ? await getMigrationCounts(prisma)
      : { appliedMigrationCount: null, failedMigrationCount: null };

    return buildDatabaseHealth({
      reachable: true,
      latencyMs: Date.now() - startedAt,
      migrationsTableExists: schemaState?.migrationsTableExists ?? false,
      appliedMigrationCount: migrationCounts.appliedMigrationCount,
      failedMigrationCount: migrationCounts.failedMigrationCount,
      expectedTables: {
        [databaseReadinessTables[0]]:
          schemaState?.organizationTableExists ?? false,
        [databaseReadinessTables[1]]: schemaState?.userTableExists ?? false,
        [databaseReadinessTables[2]]: schemaState?.sessionTableExists ?? false,
      },
    });
  } catch {
    return buildDatabaseHealth({
      reachable: false,
      latencyMs: null,
    });
  }
}

async function getMigrationCounts(
  prisma: ReturnType<typeof getPrismaClient>,
): Promise<{
  appliedMigrationCount: number;
  failedMigrationCount: number;
}> {
  const [migrationCounts] = await prisma.$queryRaw<
    {
      appliedMigrationCount: number;
      failedMigrationCount: number;
    }[]
  >(Prisma.sql`
    SELECT
      count(*) FILTER (WHERE finished_at IS NOT NULL)::int AS "appliedMigrationCount",
      count(*) FILTER (
        WHERE finished_at IS NULL AND rolled_back_at IS NULL
      )::int AS "failedMigrationCount"
    FROM public._prisma_migrations
  `);

  return {
    appliedMigrationCount: migrationCounts?.appliedMigrationCount ?? 0,
    failedMigrationCount: migrationCounts?.failedMigrationCount ?? 0,
  };
}

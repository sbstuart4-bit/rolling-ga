import { sql } from "drizzle-orm";
import type { DbHandle } from "@/db/client";
import { resolveDatabaseUrl } from "@/lib/production-env";

export type HealthCheckStatus = "ok" | "error";

export interface HealthCheckResult {
  status: HealthCheckStatus;
  checks: {
    application: HealthCheckStatus;
    database: HealthCheckStatus;
    migrations: HealthCheckStatus;
  };
  details?: {
    database?: string;
    migrationCount?: number;
    error?: string;
  };
}

const EXPECTED_MIGRATION_COUNT = 3;

async function readMigrationCount(handle: DbHandle): Promise<number> {
  const queries = [
    sql`select count(*)::int as count from drizzle.__drizzle_migrations`,
    sql`select count(*)::int as count from public.__drizzle_migrations`,
    sql`select count(*)::int as count from __drizzle_migrations`,
  ];

  for (const query of queries) {
    try {
      const rows = await handle.db.execute<{ count: number }>(query);
      return Number(rows[0]?.count ?? 0);
    } catch {
      continue;
    }
  }

  return 0;
}

async function hasApplicationSchema(handle: DbHandle): Promise<boolean> {
  try {
    await handle.db.execute(sql`select 1 from users limit 1`);
    return true;
  } catch {
    return false;
  }
}

export async function runHealthCheck(getHandle: () => DbHandle): Promise<HealthCheckResult> {
  const checks = {
    application: "ok" as HealthCheckStatus,
    database: "error" as HealthCheckStatus,
    migrations: "error" as HealthCheckStatus,
  };

  const details: HealthCheckResult["details"] = {};

  if (!resolveDatabaseUrl() && process.env.NODE_ENV === "production") {
    details.error = "DATABASE_URL is not configured";
    return { status: "error", checks, details };
  }

  try {
    const handle = getHandle();
    details.database = handle.label;

    await handle.db.execute(sql`select 1`);
    checks.database = "ok";

    const migrationCount = await readMigrationCount(handle);
    details.migrationCount = migrationCount;

    if (migrationCount >= EXPECTED_MIGRATION_COUNT || (await hasApplicationSchema(handle))) {
      checks.migrations = "ok";
    }
  } catch (error) {
    details.error = error instanceof Error ? error.message : String(error);
  }

  const status =
    checks.application === "ok" && checks.database === "ok" && checks.migrations === "ok"
      ? "ok"
      : "error";

  return { status, checks, details };
}

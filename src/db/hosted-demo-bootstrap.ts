import { sql } from "drizzle-orm";
import { demoAnchorDate } from "@/lib/demo-calendar";
import { canSeedProductionDemoDatabase } from "./demo-bootstrap-policy";
import { createDb, truncateAllTables, type DbHandle } from "./client";
import {
  areRequiredDemoPersonasReady,
  bindRepairDb,
  clearRepairDb,
  repairElenaMarisolDemoAccount,
  repairMarcusValeDemoAccount,
  repairScottDemoAccount,
} from "./demo-persona-repair";
import { runMigrations } from "./migrate";
import { seedDemoData } from "./seed";

async function countAllUsers(handle: DbHandle): Promise<number | null> {
  try {
    const rows = await handle.db.execute<{ count: number }>(
      sql`select count(*)::int as count from users`,
    );
    return Number(rows[0]?.count ?? 0);
  } catch {
    return null;
  }
}

async function demoUserCount(handle: DbHandle): Promise<number | null> {
  try {
    const rows = await handle.db.execute<{ count: number }>(
      sql`select count(*)::int as count from users where is_demo = true`,
    );
    return Number(rows[0]?.count ?? 0);
  } catch {
    return null;
  }
}

/**
 * Idempotent migrate/repair/seed for Vercel build prep and runtime bootstrap.
 * Lives in the db layer so build scripts never import server-only modules.
 */
export async function prepareHostedDemoDatabase(): Promise<void> {
  const handle = createDb();

  try {
    bindRepairDb(handle.db);
    await runMigrations(handle);

    let personasPresent = await areRequiredDemoPersonasReady();
    if (!personasPresent) {
      await Promise.all([
        repairElenaMarisolDemoAccount(),
        repairMarcusValeDemoAccount(),
        repairScottDemoAccount(),
      ]);
      personasPresent = await areRequiredDemoPersonasReady();
    }
    if (personasPresent) {
      console.log("Demo personas already present — skipping seed.");
      return;
    }

    const userCount = await countAllUsers(handle);
    const seededDemoUsers = await demoUserCount(handle);
    if (
      !canSeedProductionDemoDatabase({
        userCount,
        demoUserCount: seededDemoUsers,
        personasPresent: false,
      })
    ) {
      console.log("Skipping demo seed — database is not empty and auto-seed is not allowed.");
      return;
    }

    if ((userCount ?? 0) > 0) {
      await truncateAllTables(handle);
    }

    const summary = await seedDemoData(handle.db, demoAnchorDate());
    console.log(`Seeded ${handle.label}: ${summary}`);
  } finally {
    clearRepairDb();
    await handle.close();
  }
}

import { sql } from "drizzle-orm";
import { demoAnchorDate } from "@/lib/demo-calendar";
import { resolveBootstrapDatabaseUrl } from "@/lib/production-env";
import { canSeedProductionDemoDatabase } from "./demo-bootstrap-policy";
import { createDb, truncateAllTables, type DbHandle } from "./client";
import {
  areRequiredDemoPersonasReady,
  bindRepairDb,
  clearRepairDb,
  isGuidedDemoCatalogReady,
  repairGuidedDemoCatalogSlug,
  repairElenaMarisolDemoAccount,
  repairMarcusValeDemoAccount,
  repairScottDemoAccount,
} from "./demo-persona-repair";
import { runMigrations } from "./migrate";
import { seedDemoData } from "./seed";

export type PrepareHostedDemoDatabaseOptions = {
  /**
   * When false, only migrate and repair personas/slugs — never truncate or full seed.
   * Vercel builds use this so a long re-seed cannot fail the deployment.
   */
  allowDestructiveSeed?: boolean;
};

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

let activePrepare: Promise<void> | null = null;

async function executePrepareHostedDemoDatabase(
  options: PrepareHostedDemoDatabaseOptions,
): Promise<void> {
  const { allowDestructiveSeed = true } = options;
  const handle = createDb(resolveBootstrapDatabaseUrl(), { maxConnections: 1 });

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
    await repairGuidedDemoCatalogSlug();
    const catalogReady = await isGuidedDemoCatalogReady();
    if (personasPresent && catalogReady) {
      console.log("Demo personas and catalog already present — skipping seed.");
      return;
    }

    if (!allowDestructiveSeed) {
      if (!catalogReady) {
        console.log(
          "Skipping demo seed at build time — catalog will be prepared at runtime on the first guided demo visit.",
        );
      }
      return;
    }

    const userCount = await countAllUsers(handle);
    const seededDemoUsers = await demoUserCount(handle);
    if (
      !canSeedProductionDemoDatabase({
        userCount,
        demoUserCount: seededDemoUsers,
        personasPresent,
        catalogReady,
      })
    ) {
      if (personasPresent && !catalogReady) {
        console.warn(
          "Guided demo catalog is incomplete and auto-seed was skipped. Use a demo-only database, empty host, or set ROLLING_GA_ALLOW_DEMO_SEED=1 for a one-time full seed.",
        );
      } else {
        console.log("Skipping demo seed — database is not empty and auto-seed is not allowed.");
      }
      return;
    }

    if (personasPresent && !catalogReady) {
      console.log("Demo personas present but catalog incomplete — re-seeding demo data.");
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

/** One migrate/repair/seed flight at a time — concurrent enter-guided requests share it. */
export async function prepareHostedDemoDatabase(
  options: PrepareHostedDemoDatabaseOptions = {},
): Promise<void> {
  if (!activePrepare) {
    activePrepare = executePrepareHostedDemoDatabase(options).finally(() => {
      activePrepare = null;
    });
  }
  await activePrepare;
}

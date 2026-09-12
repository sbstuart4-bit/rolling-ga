import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { demoAnchorDate } from "@/lib/demo-calendar";
import { demoModeEnabled } from "@/lib/demo-mode";
import { resolveDatabaseUrl } from "@/lib/production-env";
import { canSeedProductionDemoDatabase } from "./demo-bootstrap-policy";
import { createDb, resolvePgliteDir, truncateAllTables, type DbHandle } from "./client";
import { runMigrations } from "./migrate";
import { seedDemoData } from "./seed";
import {
  areRequiredDemoPersonasReady,
  repairElenaMarisolDemoAccount,
  repairMarcusValeDemoAccount,
  repairScottDemoAccount,
} from "@/server/demo/ensure-demo-personas";

/** Guided demos hard-fail when either persona is missing — not just when the user row exists. */
let bootstrapPromise: Promise<void> | null = null;

function globalDbSlot(): { __rollingGaDb?: DbHandle } {
  return globalThis as unknown as { __rollingGaDb?: DbHandle };
}

/** True when PGlite WASM aborts — usually a corrupt or contended data directory. */
export function isPgliteAbortError(error: unknown): boolean {
  const text = collectErrorText(error);
  return /Aborted\(\)/.test(text) || /RuntimeError.*Aborted/.test(text);
}

/** On-disk PGlite files are missing or inconsistent — common after db:reset while dev is running. */
export function isPgliteCorruptionError(error: unknown): boolean {
  const text = collectErrorText(error);
  return (
    /58P01/.test(text) ||
    /could not open file/i.test(text) ||
    /mdopenfork/i.test(text) ||
    /duplicate key value violates unique constraint/i.test(text)
  );
}

function shouldRecoverPglite(error: unknown): boolean {
  return isPgliteAbortError(error) || isPgliteCorruptionError(error);
}

function collectErrorText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth++) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(" ");
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

async function requiredDemoPersonasPresent(): Promise<boolean | null> {
  try {
    return await areRequiredDemoPersonasReady();
  } catch {
    return null;
  }
}

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

async function closeGlobalHandle(): Promise<void> {
  const slot = globalDbSlot();
  if (!slot.__rollingGaDb) return;
  try {
    await slot.__rollingGaDb.close();
  } catch {
    /* already closed */
  }
  slot.__rollingGaDb = undefined;
}

/**
 * Drops the in-process PGlite handle so the next open reads the on-disk cluster.
 * Needed after an external `npm run db:reset` while `next dev` stays running.
 */
async function reopenPgliteFromDisk(): Promise<DbHandle> {
  await closeGlobalHandle();
  bootstrapPromise = null;
  const handle = createDb();
  globalDbSlot().__rollingGaDb = handle;
  return handle;
}

function isDemoSeedMissingError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("not seeded");
}

/** Removes the on-disk PGlite cluster so the next open starts clean. Dev only. */
function removePgliteDataDir(): void {
  const dir = resolvePgliteDir();
  if (dir === "memory://") return;
  const name = dir.replace(/^data[\\/]/, "");
  const absolute = resolve(process.cwd(), "data", name);
  rmSync(absolute, { recursive: true, force: true });
}

/**
 * Ensures migrations and demo personas exist before guided-demo entry.
 *
 * - Local PGlite: migrate/seed/recover automatically.
 * - Hosted Postgres with demo mode: migrate, then seed when the database is empty
 *   (or when ROLLING_GA_ALLOW_DEMO_SEED=1).
 */
export async function ensureDevDatabaseReady(): Promise<void> {
  if (resolveDatabaseUrl()) {
    if (!demoModeEnabled()) return;

    if (!bootstrapPromise) {
      bootstrapPromise = bootstrapProductionDemoDatabase().catch((error) => {
        bootstrapPromise = null;
        throw error;
      });
    }
    await bootstrapPromise;
    return;
  }

  if (process.env.NODE_ENV === "production") return;

  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapDevDatabase().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }
  await bootstrapPromise;
}

async function bootstrapProductionDemoDatabase(): Promise<void> {
  const handle = createDb();

  try {
    await runMigrations(handle);

    let personasPresent = await requiredDemoPersonasPresent();
    if (!personasPresent) {
      await Promise.all([
        repairElenaMarisolDemoAccount(),
        repairMarcusValeDemoAccount(),
        repairScottDemoAccount(),
      ]);
      personasPresent = await requiredDemoPersonasPresent();
    }
    if (personasPresent) {
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
      return;
    }

    if ((userCount ?? 0) > 0) {
      await truncateAllTables(handle);
    }

    await seedDemoData(handle.db, demoAnchorDate());
  } finally {
    await handle.close();
  }
}

async function bootstrapDevDatabase(): Promise<void> {
  let handle = globalDbSlot().__rollingGaDb ?? createDb();
  if (handle.driver !== "pglite") return;

  try {
    await runMigrations(handle);

    if (await requiredDemoPersonasPresent()) {
      globalDbSlot().__rollingGaDb = handle;
      return;
    }

    if (globalDbSlot().__rollingGaDb) {
      handle = await reopenPgliteFromDisk();
      await runMigrations(handle);
      if (await requiredDemoPersonasPresent()) {
        return;
      }
    }

    await recoverPgliteCluster();
  } catch (error) {
    if (!shouldRecoverPglite(error)) throw error;
    await recoverPgliteCluster();
  }
}

/**
 * PGlite allows one writer per data directory. A contended or corrupt cluster aborts
 * every query — rebuild it in dev rather than leaving /demo permanently broken.
 */
export async function recoverPgliteCluster(): Promise<void> {
  if (resolveDatabaseUrl()) return;
  if (process.env.NODE_ENV === "production") {
    throw new Error("PGlite recovery is disabled in production.");
  }

  await closeGlobalHandle();
  removePgliteDataDir();

  const handle = createDb();
  await runMigrations(handle);
  await seedDemoData(handle.db, demoAnchorDate());
  globalDbSlot().__rollingGaDb = handle;
}

/** Run a DB operation; on PGlite abort in dev, rebuild once and retry. */
export async function withDevDatabaseRecovery<T>(operation: () => Promise<T>): Promise<T> {
  await ensureDevDatabaseReady();
  try {
    return await operation();
  } catch (error) {
    if (isDemoSeedMissingError(error)) {
      bootstrapPromise = null;
      if (resolveDatabaseUrl()) {
        await ensureDevDatabaseReady();
        return operation();
      }
      await recoverPgliteCluster();
      return operation();
    }

    if (resolveDatabaseUrl() || process.env.NODE_ENV === "production") {
      throw error;
    }

    if (!shouldRecoverPglite(error)) throw error;
    bootstrapPromise = null;
    await recoverPgliteCluster();
    return operation();
  }
}

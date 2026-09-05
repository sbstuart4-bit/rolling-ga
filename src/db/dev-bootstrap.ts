import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { sql } from "drizzle-orm";
import { demoAnchorDate } from "@/lib/demo-calendar";
import { resolveDatabaseUrl } from "@/lib/production-env";
import { createDb, resolvePgliteDir, type DbHandle } from "./client";
import { runMigrations } from "./migrate";
import { seedDemoData } from "./seed";

let bootstrapPromise: Promise<void> | null = null;

function globalDbSlot(): { __rollingGaDb?: DbHandle } {
  return globalThis as unknown as { __rollingGaDb?: DbHandle };
}

/** True when PGlite WASM aborts — usually a corrupt or contended data directory. */
export function isPgliteAbortError(error: unknown): boolean {
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
  const text = parts.join(" ");
  return /Aborted\(\)/.test(text) || /RuntimeError.*Aborted/.test(text);
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

/** Removes the on-disk PGlite cluster so the next open starts clean. Dev only. */
function removePgliteDataDir(): void {
  const dir = resolvePgliteDir();
  if (dir === "memory://") return;
  const name = dir.replace(/^data[\\/]/, "");
  const absolute = resolve(process.cwd(), "data", name);
  rmSync(absolute, { recursive: true, force: true });
}

/**
 * In local dev with PGlite, migrate and seed automatically when the schema or demo
 * rows are missing. Avoids a blank /demo after clone when someone skips `db:setup`.
 */
export async function ensureDevDatabaseReady(): Promise<void> {
  if (resolveDatabaseUrl()) return;
  if (process.env.NODE_ENV === "production") return;

  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapDevDatabase().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }
  await bootstrapPromise;
}

async function bootstrapDevDatabase(): Promise<void> {
  let handle = globalDbSlot().__rollingGaDb ?? createDb();
  if (handle.driver !== "pglite") return;

  const seeded = await demoUserCount(handle);
  if (seeded !== null && seeded > 0) return;

  try {
    await runMigrations(handle);
    if ((await demoUserCount(handle)) === 0) {
      await seedDemoData(handle.db, demoAnchorDate());
    }
    globalDbSlot().__rollingGaDb = handle;
  } catch (error) {
    if (!isPgliteAbortError(error)) throw error;
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
    if (!isPgliteAbortError(error) || resolveDatabaseUrl() || process.env.NODE_ENV === "production") {
      throw error;
    }
    bootstrapPromise = null;
    await recoverPgliteCluster();
    return operation();
  }
}

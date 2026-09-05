import { demoAnchorDate } from "@/lib/demo-calendar";
import { createDb, type DbHandle, truncateAllTables } from "./client";
import { runMigrations } from "./migrate";
import { seedDemoData } from "./seed";

/**
 * Empties every table and re-seeds demo data anchored to June 1.
 *
 * On SQLite this deleted and rebuilt the database file, with an in-place fallback for
 * when Windows still held the handle. Postgres has no file to remove, so the reset is a
 * single `TRUNCATE ... CASCADE` and the file-locking fallback is gone with it.
 */
export async function resetDemoDatabase(): Promise<string> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo reset is disabled in production.");
  }

  // Reuse the process connection when there is one. PGlite allows a single writer per
  // data directory, so opening a second handle from inside the dev server would fail.
  const cached = cachedHandle();
  const handle = cached ?? createDb();

  try {
    await runMigrations(handle);
    await truncateAllTables(handle);
    return await seedDemoData(handle.db, demoAnchorDate());
  } finally {
    if (!cached) await handle.close();
  }
}

function cachedHandle(): DbHandle | undefined {
  return (globalThis as unknown as { __rollingGaDb?: DbHandle }).__rollingGaDb;
}

/**
 * Vitest setup.
 *
 * Each test file gets its own PostgreSQL database, migrated from the same baseline the
 * application uses. PGlite is PostgreSQL compiled to WebAssembly and runs in-process, so
 * the suite exercises real Postgres types, defaults, constraints and SQLSTATE error codes
 * without requiring a server to be installed or a container to be running.
 *
 * Every instance carries a WebAssembly Postgres heap, so `fileParallelism` is disabled in
 * vitest.config.ts and the instance is closed on teardown: only one exists at a time.
 *
 * Server-only modules that would crash in a Node test context are bypassed here by
 * setting up globalThis before any import resolves them.
 */
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, vi } from "vitest";
import { createPgliteDb, type Db, type DbHandle } from "@/db/client";

// Prevent the "server-only" package from throwing in a Node test environment.
vi.mock("server-only", () => ({}));

declare global {
  var __testDb: Db;
}

let handle: DbHandle | undefined;

beforeAll(async () => {
  handle = createPgliteDb(new PGlite());
  await handle.migrate(resolve(__dirname, "../../drizzle"));

  globalThis.__testDb = handle.db;

  // Point the application singleton at our database so all server modules that import
  // @/db get the test database without code changes.
  (globalThis as unknown as { __rollingGaDb?: DbHandle }).__rollingGaDb = handle;
}, 120_000);

afterAll(async () => {
  await handle?.close();
  handle = undefined;
});

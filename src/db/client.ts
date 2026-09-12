import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { assertProductionDatabaseUrl, resolveDatabaseUrl } from "@/lib/production-env";
import * as schema from "./schema";

/**
 * The single database type the rest of the application sees.
 *
 * Both supported drivers are `PgDatabase` implementations with an identical query
 * builder; only the underlying session differs. Naming one of them as the canonical
 * type keeps every call site free of driver narrowing.
 */
export type Db = PostgresJsDatabase<typeof schema>;

export type DbDriver = "postgres-js" | "pglite";

export interface DbHandle {
  db: Db;
  driver: DbDriver;
  /** Human-readable target, safe to log — never contains credentials. */
  label: string;
  migrate(migrationsFolder: string): Promise<void>;
  /** Maintenance SQL escape hatch. Not for application queries. */
  execute(sql: string): Promise<void>;
  close(): Promise<void>;
}

/** Where PGlite keeps its cluster when no external Postgres is configured. */
export const DEFAULT_PGLITE_DIR = "data/pg";

export { resolveDatabaseUrl } from "@/lib/production-env";

export function resolvePgliteDir(): string {
  return process.env.ROLLING_GA_PGLITE_DIR ?? DEFAULT_PGLITE_DIR;
}

/** Strips credentials so a connection target can be logged. */
function describeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return "postgres";
  }
}

/**
 * Opens a PostgreSQL connection and wraps it in Drizzle.
 *
 * `postgres-js` is used whenever a connection string is configured. Without one the
 * process falls back to PGlite, which is PostgreSQL itself compiled to WebAssembly and
 * runs in-process — so local development and the test suite exercise real Postgres
 * types, constraints and error codes without needing a server installed.
 */
export interface CreateDbOptions {
  /** Connection pool ceiling. Must be 1 against a single-session server such as PGlite. */
  maxConnections?: number;
}

export function createDb(url = resolveDatabaseUrl(), options: CreateDbOptions = {}): DbHandle {
  assertProductionDatabaseUrl(url);

  if (url) {
    const client = postgres(url, {
      max: options.maxConnections ?? 10,
      // Prepared statements are unavailable through a transaction-mode connection
      // pooler, which is how a hosted Postgres is normally reached.
      prepare: false,
    });
    const db = drizzlePostgres(client, { schema });

    return {
      db,
      driver: "postgres-js",
      label: describeUrl(url),
      migrate: (folder) => migratePostgres(db, { migrationsFolder: folder }),
      execute: async (sql) => {
        await client.unsafe(sql);
      },
      close: () => client.end({ timeout: 5 }),
    };
  }

  const dir = resolvePgliteDir();
  if (dir === "memory://") {
    return createPgliteDb(new PGlite(), "memory://");
  }

  const absolute = resolvePgliteAbsolutePath(dir);
  mkdirSync(absolute, { recursive: true });
  return createPgliteDb(new PGlite(absolute), dir);
}

/** Known PGlite dirs only — static segments keep Turbopack from tracing all of `data/**`. */
function resolvePgliteAbsolutePath(dir: string): string {
  switch (dir) {
    case "data/pg-demo":
      return resolve(process.cwd(), "data", "pg-demo");
    case "data/pg-verify":
      return resolve(process.cwd(), "data", "pg-verify");
    case "data/pg-e2e":
      return resolve(process.cwd(), "data", "pg-e2e");
    case "data/pg-run":
      return resolve(process.cwd(), "data", "pg-run");
    case DEFAULT_PGLITE_DIR:
    case "data/pg":
      return resolve(process.cwd(), "data", "pg");
    default:
      return resolve(process.cwd(), "data", "pg");
  }
}

/** Wraps an already-constructed PGlite instance. Used by the test harness. */
export function createPgliteDb(client: PGlite, label = "memory://"): DbHandle {
  const db = drizzlePglite(client, { schema }) as unknown as Db;

  return {
    db,
    driver: "pglite",
    label: `pglite:${label}`,
    migrate: (folder) =>
      migratePglite(db as never, {
        migrationsFolder: folder,
      }),
    execute: async (sql) => {
      await client.exec(sql);
    },
    close: () => client.close(),
  };
}

/** Every table defined in the Drizzle schema, in declaration order. */
export function schemaTableNames(): string[] {
  const names: string[] = [];
  for (const value of Object.values(schema) as unknown[]) {
    if (is(value, PgTable)) names.push(getTableName(value));
  }
  return names;
}

/**
 * Empties every application table in one statement. `CASCADE` makes the order
 * irrelevant, which is what the SQLite implementation used a foreign-key pragma for.
 * The Drizzle migrations bookkeeping table is deliberately untouched.
 */
export async function truncateAllTables(handle: DbHandle): Promise<void> {
  const tables = schemaTableNames()
    .map((name) => `"${name}"`)
    .join(", ");
  await handle.execute(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
}

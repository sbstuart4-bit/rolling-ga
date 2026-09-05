import "server-only";
import { createDb, type Db, type DbHandle } from "./client";

/**
 * One connection per process. Next.js re-evaluates modules on hot reload, so the
 * handle is parked on `globalThis` to avoid opening a new pool on every rebuild.
 */
const globalForDb = globalThis as unknown as {
  __rollingGaDb?: DbHandle;
};

export function dbHandle(): DbHandle {
  globalForDb.__rollingGaDb ??= createDb();
  return globalForDb.__rollingGaDb;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const target = dbHandle().db;
    const value = target[prop as keyof Db];
    return typeof value === "function" ? value.bind(target) : value;
  },
}) as Db;

export * as schema from "./schema";

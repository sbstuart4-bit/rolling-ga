import { resolve } from "node:path";
import { createDb, type DbHandle } from "./client";

export const MIGRATIONS_FOLDER = resolve(process.cwd(), "drizzle");

export async function runMigrations(handle: DbHandle = createDb()): Promise<DbHandle> {
  await handle.migrate(MIGRATIONS_FOLDER);
  return handle;
}

/** `npm run db:migrate` */
async function main() {
  const handle = await runMigrations();
  const { label } = handle;
  await handle.close();
  console.log(`Migrations applied to ${label}`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("src/db/migrate.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

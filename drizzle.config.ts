import { defineConfig } from "drizzle-kit";

/**
 * `drizzle-kit generate` diffs the schema against the snapshots in ./drizzle and does
 * not connect, so the credentials here only matter for the commands that do (`push`,
 * `studio`). Local development without a connection string runs on PGlite, which
 * drizzle-kit cannot introspect — use `npm run db:migrate` for that.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.ROLLING_GA_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/rollingga",
  },
  strict: true,
  verbose: true,
});

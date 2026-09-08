import { demoAnchorDate } from "@/lib/demo-calendar";
import { shouldSeedDemoDatabaseAtBuildTime } from "../demo-bootstrap-policy";
import { createDb } from "../client";
import { runMigrations } from "../migrate";
import { seedDemoData } from "./index";

/**
 * `npm run db:seed`
 *
 * Refuses to run against a production database unless someone has explicitly opted in,
 * so demo rows can never quietly appear in a real one.
 */
async function main() {
  if (process.env.NODE_ENV === "production" && !shouldSeedDemoDatabaseAtBuildTime()) {
    console.error(
      "Refusing to seed demo data with NODE_ENV=production.\n" +
        "Set ROLLING_GA_PUBLIC_GUIDED_DEMO=1, ROLLING_GA_DEMO=1, or ROLLING_GA_ALLOW_DEMO_SEED=1.",
    );
    process.exit(1);
  }

  const handle = createDb();

  try {
    await runMigrations(handle);
    const summary = await seedDemoData(handle.db, demoAnchorDate());
    console.log(`Seeded ${handle.label}: ${summary}`);
  } finally {
    await handle.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

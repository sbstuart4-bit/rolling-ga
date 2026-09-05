import { demoAnchorDate } from "@/lib/demo-calendar";
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
  if (process.env.NODE_ENV === "production" && process.env.ROLLING_GA_ALLOW_DEMO_SEED !== "1") {
    console.error(
      "Refusing to seed demo data with NODE_ENV=production.\n" +
        "Set ROLLING_GA_ALLOW_DEMO_SEED=1 if this really is what you want.",
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

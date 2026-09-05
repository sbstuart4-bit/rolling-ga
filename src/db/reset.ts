import { resetDemoDatabase } from "./reset-demo-data";

/**
 * `npm run db:reset` — truncates every application table, re-applies migrations if
 * needed, and re-seeds the demo dataset. Refuses to touch a production database.
 */
async function main() {
  const summary = await resetDemoDatabase();
  console.log(`Seeded demo data: ${summary}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

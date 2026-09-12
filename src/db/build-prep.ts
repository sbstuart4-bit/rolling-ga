import { shouldSeedDemoDatabaseAtBuildTime } from "./demo-bootstrap-policy";
import { prepareHostedDemoDatabase } from "./hosted-demo-bootstrap";
import { resolveDatabaseUrl } from "@/lib/production-env";

/**
 * Optional database prep during Vercel builds.
 *
 * Vercel often scopes DATABASE_URL to runtime only. When the URL is unavailable
 * at build time we skip quietly and let the enter-guided API migrate/seed on
 * the first demo visit instead.
 */
async function main() {
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    console.log(
      "Skipping database migrate/seed at build time — DATABASE_URL is not available to this build.",
    );
    return;
  }

  if (!shouldSeedDemoDatabaseAtBuildTime()) {
    console.log(
      "Skipping demo seed at build time (set ROLLING_GA_PUBLIC_GUIDED_DEMO=1, ROLLING_GA_DEMO=1, or ROLLING_GA_ALLOW_DEMO_SEED=1).",
    );
    return;
  }

  await prepareHostedDemoDatabase();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

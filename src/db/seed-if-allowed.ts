import { execSync } from "node:child_process";
import { shouldSeedDemoDatabaseAtBuildTime } from "./demo-bootstrap-policy";

/**
 * Used by Vercel builds to seed demo data when this is a hosted demo deployment.
 */
function main() {
  if (!shouldSeedDemoDatabaseAtBuildTime()) {
    console.log(
      "Skipping demo seed (set ROLLING_GA_PUBLIC_GUIDED_DEMO=1, ROLLING_GA_DEMO=1, or ROLLING_GA_ALLOW_DEMO_SEED=1).",
    );
    return;
  }

  execSync("npm run db:seed", { stdio: "inherit" });
}

main();

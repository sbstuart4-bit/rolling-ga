import { execSync } from "node:child_process";

/**
 * Used by Vercel builds to seed demo data only when explicitly enabled.
 * Skips quietly when ROLLING_GA_ALLOW_DEMO_SEED is not set.
 */
function main() {
  if (process.env.ROLLING_GA_ALLOW_DEMO_SEED !== "1") {
    console.log("Skipping demo seed (ROLLING_GA_ALLOW_DEMO_SEED is not set).");
    return;
  }

  execSync("npm run db:seed", { stdio: "inherit" });
}

main();

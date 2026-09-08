import { demoModeEnabled } from "@/lib/demo-mode";

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Whether a hosted deployment may run the full demo seed.
 *
 * - Explicit opt-in via ROLLING_GA_ALLOW_DEMO_SEED=1 (build scripts, one-time setup)
 * - Otherwise only when demo mode is on and the users table is completely empty
 */
export function canSeedProductionDemoDatabase(userCount: number | null): boolean {
  if (process.env.ROLLING_GA_ALLOW_DEMO_SEED === "1") return true;
  if (!isProductionRuntime() || !demoModeEnabled()) return false;
  return userCount === 0;
}

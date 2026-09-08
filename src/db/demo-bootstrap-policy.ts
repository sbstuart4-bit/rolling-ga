import { demoModeEnabled, fullDemoBoardEnabled, publicGuidedDemoEnabled } from "@/lib/demo-mode";

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export interface ProductionDemoSeedDecisionInput {
  userCount: number | null;
  demoUserCount: number | null;
  personasPresent: boolean;
}

/**
 * Whether a hosted deployment may run the full demo seed.
 *
 * - Explicit opt-in via ROLLING_GA_ALLOW_DEMO_SEED=1 (build scripts, one-time setup)
 * - Empty database on a demo-enabled host
 * - Demo-only database missing required personas (incomplete/broken prior seed)
 */
export function canSeedProductionDemoDatabase({
  userCount,
  demoUserCount,
  personasPresent,
}: ProductionDemoSeedDecisionInput): boolean {
  if (personasPresent) return false;
  if (process.env.ROLLING_GA_ALLOW_DEMO_SEED === "1") return true;
  if (!isProductionRuntime() || !demoModeEnabled()) return false;
  if (userCount === 0) return true;

  return (
    userCount !== null &&
    demoUserCount !== null &&
    userCount === demoUserCount &&
    userCount > 0
  );
}

/** Whether Vercel should seed during vercel-build. */
export function shouldSeedDemoDatabaseAtBuildTime(): boolean {
  if (process.env.ROLLING_GA_ALLOW_DEMO_SEED === "1") return true;
  return publicGuidedDemoEnabled() || fullDemoBoardEnabled();
}

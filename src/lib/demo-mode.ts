/** Shared demo-mode check — safe in proxy, server components, and actions. */

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Full demo board at `/demo`, root redirect, and hosted board gate (`ROLLING_GA_DEMO=1`). */
export function fullDemoBoardEnabled(): boolean {
  if (!isProductionRuntime()) return true;
  return process.env.ROLLING_GA_DEMO === "1";
}

/**
 * Public marketing guided demo on a production marketing host (`ROLLING_GA_PUBLIC_GUIDED_DEMO=1`).
 * Enables guided-demo machinery without redirecting anonymous `/` visitors to the demo board.
 */
export function publicGuidedDemoEnabled(): boolean {
  if (!isProductionRuntime()) return false;
  return process.env.ROLLING_GA_PUBLIC_GUIDED_DEMO === "1";
}

/** Guided demo, demo clock, scenario engine, and seeded persona login. */
export function demoModeEnabled(): boolean {
  if (!isProductionRuntime()) return true;
  return fullDemoBoardEnabled() || publicGuidedDemoEnabled();
}

/** Where anonymous visitors land in demo vs production. */
export function unauthenticatedEntryPath(): string {
  return demoModeEnabled() ? "/demo" : "/welcome";
}

/** True when the request was triggered by in-app navigation (e.g. tab bar), not a fresh open. */
export function isSameOriginReferer(headers: Headers, origin: string): boolean {
  const referer = headers.get("referer");
  if (!referer) return false;
  try {
    return new URL(referer).origin === origin;
  } catch {
    return false;
  }
}

/**
 * Demo board opens at `/` for fresh visits. Public guided-demo-only hosts keep marketing at `/`.
 */
export function shouldRedirectRootToDemoBoard({
  pathname,
  demoMode,
  hasSession,
  inAppNavigation,
}: {
  pathname: string;
  demoMode: boolean;
  hasSession: boolean;
  inAppNavigation: boolean;
}): boolean {
  return pathname === "/" && demoMode && (!hasSession || !inAppNavigation);
}

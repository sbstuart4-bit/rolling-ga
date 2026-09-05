/** Shared demo-mode check — safe in proxy, server components, and actions. */
export function demoModeEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.ROLLING_GA_DEMO === "1";
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
 * Demo mode opens at the persona picker. Fresh visits to `/` (bookmark, dev server root,
 * typed URL) redirect to `/demo`; in-app links to `/` keep the fan home feed.
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

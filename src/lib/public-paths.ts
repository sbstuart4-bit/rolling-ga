/**
 * Paths the edge proxy lets through without a session cookie.
 * Role and tenant checks still happen in page loaders and server actions.
 */
export const MARKETING_PATHS = [
  "/home",
  "/i-was-there",
  "/product",
  "/for-artists",
  "/for-fans",
  "/how-it-works",
  "/partners",
  "/about",
  "/pilot",
] as const;

export const PUBLIC_PATHS = [
  "/welcome",
  "/sign-in",
  "/sign-up",
  "/demo",
  "/no-access",
  "/api/time",
  "/api/health",
  "/c",
  "/e",
] as const;

/** Assets must never hit the unauthenticated /demo bounce. */
export function isStaticAssetPath(pathname: string): boolean {
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon" ||
    pathname.startsWith("/icon/")
  ) {
    return true;
  }
  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|woff2|woff|js|map)$/i.test(pathname);
}

export function isPublicPath(pathname: string): boolean {
  if (
    MARKETING_PATHS.some(
      (path) =>
        pathname === path ||
        pathname.startsWith(`${path}/opengraph-image`) ||
        pathname.startsWith(`${path}/twitter-image`),
    )
  ) {
    return true;
  }
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Production visitors without a session should see the marketing homepage at `/`.
 * Demo mode keeps the existing bounce to `/demo`. Authenticated `/` stays the fan home.
 */
export function shouldRewriteRootToMarketing({
  pathname,
  hasSession,
  demoMode,
}: {
  pathname: string;
  hasSession: boolean;
  demoMode: boolean;
}): boolean {
  return pathname === "/" && !hasSession && !demoMode;
}

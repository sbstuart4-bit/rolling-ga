import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_BOARD_ACCESS_COOKIE, SESSION_COOKIE_NAME } from "@/lib/auth-cookies";
import {
  demoModeEnabled,
  isSameOriginReferer,
  shouldRedirectRootToDemoBoard,
  unauthenticatedEntryPath,
} from "@/lib/demo-mode";
import { isPublicPath, isStaticAssetPath, shouldRewriteRootToMarketing } from "@/lib/public-paths";
import {
  hostedDemoBoardGateRequired,
  resolveDemoBoardSecret,
} from "@/lib/production-env";
import {
  createSignedCookieValue,
  verifySignedCookie,
} from "@/lib/signed-cookie-edge";

/**
 * Coarse gate only: it verifies that a signed session cookie is present and bounces
 * anonymous visitors to sign-in with somewhere to return to.
 *
 * It deliberately does not look at roles or tenancy. Real authorization happens in the
 * server functions and page loaders via `src/server/auth/guards.ts`, because anything
 * enforced only here would be bypassed by a direct POST to a server action.
 */
function sessionSecretForMiddleware(): string {
  const secret = process.env.ROLLING_GA_SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ROLLING_GA_SESSION_SECRET must be set to at least 16 characters in production.",
    );
  }
  return "rolling-ga-development-only-session-secret";
}

async function readSessionIdFromRequest(request: NextRequest): Promise<string | null> {
  const raw = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;

  const separator = raw.lastIndexOf(".");
  if (separator <= 0) return null;

  const sessionId = raw.slice(0, separator);
  const verified = await verifySignedCookie(raw, sessionSecretForMiddleware());
  return verified ? sessionId : null;
}

async function grantDemoBoardAccess(request: NextRequest): Promise<NextResponse | null> {
  if (!hostedDemoBoardGateRequired()) return null;

  const secret = resolveDemoBoardSecret();
  if (!secret) return null;

  const accessToken = request.nextUrl.searchParams.get("access");
  if (!accessToken || accessToken !== secret) return null;

  const destination = new URL("/demo", request.url);
  destination.search = "";
  const response = NextResponse.redirect(destination);
  const cookieValue = await createSignedCookieValue("granted", secret);
  response.cookies.set(DEMO_BOARD_ACCESS_COOKIE, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isStaticAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    const granted = await grantDemoBoardAccess(request);
    if (granted) return granted;
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionId = await readSessionIdFromRequest(request);
  const demoMode = demoModeEnabled();
  const inAppNavigation = isSameOriginReferer(request.headers, request.nextUrl.origin);

  if (
    shouldRedirectRootToDemoBoard({
      pathname,
      demoMode,
      hasSession: Boolean(sessionId),
      inAppNavigation,
    })
  ) {
    const response = NextResponse.redirect(new URL("/demo", request.url));
    if (sessionId) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  if (sessionId) return NextResponse.next();

  if (shouldRewriteRootToMarketing({ pathname, hasSession: false, demoMode })) {
    return NextResponse.rewrite(new URL("/home", request.url));
  }

  const entry = new URL(unauthenticatedEntryPath(), request.url);
  if (pathname !== entry.pathname) {
    entry.searchParams.set("next", `${pathname}${search}`);
  }
  return NextResponse.redirect(entry);
}

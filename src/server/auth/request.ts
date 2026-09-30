import "server-only";
import { redirect } from "next/navigation";
import {
  buildEnterGuidedDemoUrl,
  isArtistGuidedDemoQuery,
  isFanGuidedDemoQuery,
} from "@/lib/guided-demo-entry";
import { demoModeEnabled } from "@/lib/demo-mode";
import type { PlatformRole } from "@/lib/types";
import { canAccessArtist, hasAnyRole, isAdmin } from "./guards";
import { type AuthContext, getAuthContext } from "./session";

export { getAuthContext };

/** For pages: send anonymous visitors to sign in and bring them back afterwards. */
function redirectDemoUnauthenticated(returnTo?: string): never {
  if (returnTo?.startsWith("/")) {
    try {
      const url = new URL(returnTo, "http://local");
      const pathWithQuery = `${url.pathname}${url.search}`;
      if (
        url.pathname.startsWith("/studio") &&
        isArtistGuidedDemoQuery(url.searchParams)
      ) {
        redirect(buildEnterGuidedDemoUrl(pathWithQuery));
      }
      if (
        !url.pathname.startsWith("/studio") &&
        isFanGuidedDemoQuery(url.searchParams)
      ) {
        redirect(buildEnterGuidedDemoUrl(pathWithQuery));
      }
    } catch {
      // fall through to demo board
    }
    redirect(`/demo?next=${encodeURIComponent(returnTo)}`);
  }
  redirect("/demo");
}

export async function requireAuth(returnTo?: string): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    if (demoModeEnabled()) {
      redirectDemoUnauthenticated(returnTo);
    }
    redirect(returnTo ? `/sign-in?next=${encodeURIComponent(returnTo)}` : "/sign-in");
  }
  return ctx;
}

/**
 * For pages behind a role. Renders the shared no-access screen rather than a 404 so
 * someone signed in as the wrong persona understands what happened.
 */
export async function requireAuthWithRole(
  roles: PlatformRole[],
  returnTo?: string,
): Promise<AuthContext> {
  const ctx = await requireAuth(returnTo);
  if (!hasAnyRole(ctx, roles) && !isAdmin(ctx)) {
    redirect(`/no-access?need=${encodeURIComponent(roles.join(","))}`);
  }
  return ctx;
}

export async function requireArtistPage(artistId: string, returnTo?: string): Promise<AuthContext> {
  const ctx = await requireAuth(returnTo);
  if (!canAccessArtist(ctx, artistId)) {
    redirect(`/no-access?need=artist_member`);
  }
  return ctx;
}

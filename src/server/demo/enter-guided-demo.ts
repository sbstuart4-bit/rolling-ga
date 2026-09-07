import "server-only";

import { NextResponse } from "next/server";
import { demoModeEnabled } from "@/lib/demo-mode";
import { parseGuidedDemoQuery } from "@/lib/guided-demo-entry";
import {
  applyArtistGuidedStepState,
  loadArtistGuidedStepContext,
} from "@/server/demo/artist-guided-demo-apply";
import { applyGuidedStepState, loadGuidedStepContext } from "@/server/demo/guided-demo-apply";

function safeReturnPath(raw: string | null, base: string): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  try {
    const url = new URL(raw, base);
    if (url.origin !== new URL(base).origin) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

/**
 * Route handler entry for anonymous guided-demo routes.
 * Cookie writes are only allowed here (and in Server Actions), not in layouts.
 */
export async function handleEnterGuidedDemoRequest(request: Request): Promise<Response> {
  const base = request.url;

  if (!demoModeEnabled()) {
    return NextResponse.redirect(new URL("/demo/guided?unavailable=1", base));
  }

  const returnTo = safeReturnPath(new URL(base).searchParams.get("returnTo"), base);
  if (!returnTo) {
    return NextResponse.redirect(new URL("/home", base));
  }

  const parsed = parseGuidedDemoQuery(new URL(returnTo, base).searchParams);
  if (!parsed) {
    return NextResponse.redirect(new URL("/demo/guided", base));
  }

  try {
    if (parsed.perspective === "artist") {
      const ctx = await loadArtistGuidedStepContext(parsed.journeyId, parsed.step, {
        presenter: parsed.presenter,
        autoplay: parsed.autoplay,
      });
      if (!ctx) {
        return NextResponse.redirect(new URL("/demo/guided", base));
      }

      await applyArtistGuidedStepState(ctx);
      return NextResponse.redirect(new URL(returnTo, base));
    }

    const ctx = await loadGuidedStepContext(parsed.journeyId, parsed.step, {
      presenter: parsed.presenter,
      autoplay: parsed.autoplay,
    });
    if (!ctx) {
      return NextResponse.redirect(new URL("/demo/guided", base));
    }

    await applyGuidedStepState(ctx);
    return NextResponse.redirect(new URL(returnTo, base));
  } catch (error) {
    if (error instanceof Error && error.message.includes("not seeded")) {
      return NextResponse.redirect(new URL("/demo/guided?unavailable=seed", base));
    }
    throw error;
  }
}

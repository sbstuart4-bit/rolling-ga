import "server-only";

import { NextResponse } from "next/server";
import { ensureDevDatabaseReady } from "@/db/dev-bootstrap";
import { isGuidedDemoCatalogReady, isScottDemoAccountReady } from "@/db/demo-persona-repair";
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

  try {
    await Promise.race([
      ensureDevDatabaseReady(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("guided-demo-bootstrap-timeout")), 45_000);
      }),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === "guided-demo-bootstrap-timeout") {
      return NextResponse.redirect(new URL("/demo/guided?unavailable=seed", base));
    }
    throw error;
  }

  const returnTo = safeReturnPath(new URL(base).searchParams.get("returnTo"), base);
  if (!returnTo) {
    return NextResponse.redirect(new URL("/home", base));
  }

  const parsed = parseGuidedDemoQuery(new URL(returnTo, base).searchParams);
  if (!parsed) {
    return NextResponse.redirect(new URL("/home", base));
  }

  if (parsed.perspective === "fan") {
    const [catalogReady, scottReady] = await Promise.all([
      isGuidedDemoCatalogReady(),
      isScottDemoAccountReady(),
    ]);
    if (!catalogReady || !scottReady) {
      return NextResponse.redirect(new URL("/demo/guided?unavailable=seed", base));
    }
  }

  try {
    if (parsed.perspective === "artist") {
      const ctx = await loadArtistGuidedStepContext(parsed.journeyId, parsed.step, {
        presenter: parsed.presenter,
        autoplay: parsed.autoplay,
      });
      if (!ctx) {
        return NextResponse.redirect(new URL("/home", base));
      }

      await applyArtistGuidedStepState(ctx, { revalidateLayout: false });
      return NextResponse.redirect(new URL(returnTo, base));
    }

    const ctx = await loadGuidedStepContext(parsed.journeyId, parsed.step, {
      presenter: parsed.presenter,
      autoplay: parsed.autoplay,
    });
    if (!ctx) {
      return NextResponse.redirect(new URL("/home", base));
    }

    await applyGuidedStepState(ctx, { revalidateLayout: false });
    return NextResponse.redirect(new URL(returnTo, base));
  } catch (error) {
    if (error instanceof Error && error.message.includes("not seeded")) {
      return NextResponse.redirect(new URL("/demo/guided?unavailable=seed", base));
    }
    throw error;
  }
}

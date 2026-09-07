"use server";

import { demoModeEnabled } from "@/lib/demo-mode";
import { getAuthContext } from "@/server/auth/session";
import {
  ensureArtistGuidedDemoFromSearchParams,
  isElenaMarisolDemoSession,
} from "./artist-guided-demo-apply";

export type BootstrapArtistGuidedDemoResult =
  | { ok: true }
  | { ok: false; error: string; redirectTo?: string };

export async function bootstrapArtistGuidedDemoSessionAction(params: {
  guided: string;
  step: string;
  presenter?: string;
  autoplay?: string;
}): Promise<BootstrapArtistGuidedDemoResult> {
  if (!demoModeEnabled()) {
    return { ok: false, error: "Demo mode is not enabled.", redirectTo: "/demo/guided?unavailable=1" };
  }

  try {
    const existing = await getAuthContext();
    if (existing && isElenaMarisolDemoSession(existing)) {
      await ensureArtistGuidedDemoFromSearchParams({
        guided: params.guided,
        step: params.step,
        presenter: params.presenter,
        autoplay: params.autoplay,
      });
      return { ok: true };
    }

    await ensureArtistGuidedDemoFromSearchParams({
      guided: params.guided,
      step: params.step,
      presenter: params.presenter,
      autoplay: params.autoplay,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("not seeded")) {
      return {
        ok: false,
        error: "Demo artist team member Elena Vasquez is not in the database.",
        redirectTo: "/demo/guided?unavailable=seed",
      };
    }

    const message =
      error instanceof Error ? error.message : "Could not start the artist guided demo.";
    return { ok: false, error: message };
  }
}

"use server";

import { demoModeEnabled } from "@/lib/demo-mode";
import { syncArtistGuidedDemoFromSearchParams } from "@/server/demo/artist-guided-demo-state";

export async function ensureArtistGuidedDemoFromUrlAction(params: {
  guided: string;
  step: string;
  presenter?: string;
  autoplay?: string;
}): Promise<void> {
  if (!demoModeEnabled()) return;
  await syncArtistGuidedDemoFromSearchParams({
    guided: params.guided,
    step: params.step,
    presenter: params.presenter,
    autoplay: params.autoplay,
  });
}

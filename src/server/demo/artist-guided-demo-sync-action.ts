"use server";

import { ensureDevDatabaseReady } from "@/db/dev-bootstrap";
import { demoModeEnabled } from "@/lib/demo-mode";
import { ensureArtistGuidedDemoFromSearchParams } from "@/server/demo/artist-guided-demo-apply";

export async function ensureArtistGuidedDemoFromUrlAction(params: {
  guided: string;
  step: string;
  presenter?: string;
  autoplay?: string;
}): Promise<void> {
  if (!demoModeEnabled()) return;
  await ensureDevDatabaseReady();
  await ensureArtistGuidedDemoFromSearchParams({
    guided: params.guided,
    step: params.step,
    presenter: params.presenter,
    autoplay: params.autoplay,
  });
}

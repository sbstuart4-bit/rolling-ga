import "server-only";

import {
  activeArtistGuidedJourneyId,
  getArtistGuidedJourney,
} from "@/lib/artist-guided-demo";
import { buildEnterGuidedDemoUrl } from "@/lib/guided-demo-entry";
import { demoModeEnabled } from "@/lib/demo-mode";
import { resolveArtistGuidedStepRoute } from "@/server/demo/artist-guided-demo-state";

/**
 * GET entry for artist guided demo — no DB work here; `/api/demo/enter-guided` bootstraps once.
 */
export function buildArtistMarketingEnterGuidedHref(): string {
  if (!demoModeEnabled()) return "/home";

  const journeyId = activeArtistGuidedJourneyId();
  const journey = getArtistGuidedJourney(journeyId);
  const step = journey?.steps[0];
  if (!step) return "/home";

  const route = resolveArtistGuidedStepRoute(step);
  return buildEnterGuidedDemoUrl(`${route}?guided=${journeyId}&step=1`);
}

/** @deprecated Prefer `buildArtistMarketingEnterGuidedHref()` — kept for async call sites. */
export async function getArtistMarketingEnterGuidedHref(): Promise<string> {
  return buildArtistMarketingEnterGuidedHref();
}

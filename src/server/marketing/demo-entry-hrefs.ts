import "server-only";

import {
  activeArtistGuidedJourneyId,
  getArtistGuidedJourney,
} from "@/lib/artist-guided-demo";
import {
  activeGuidedJourneyId,
  getGuidedJourney,
  resolveGuidedRoute,
} from "@/lib/guided-demo";
import { buildEnterGuidedDemoUrl } from "@/lib/guided-demo-entry";
import { demoModeEnabled } from "@/lib/demo-mode";
import { getDemoShow } from "@/lib/demo-scenario/shows";
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

/**
 * GET entry for the Marisol fan guided journey — `/api/demo/enter-guided` bootstraps once.
 */
export function buildFanMarketingEnterGuidedHref(): string {
  if (!demoModeEnabled()) return "/home";

  const journeyId = activeGuidedJourneyId();
  const journey = getGuidedJourney(journeyId);
  const step = journey?.steps[0];
  const show = journey ? getDemoShow(journey.showKey) : undefined;
  if (!step || !show) return "/home";

  const route = resolveGuidedRoute(step.route, show);
  return buildEnterGuidedDemoUrl(`${route}?guided=${journeyId}&step=1`);
}

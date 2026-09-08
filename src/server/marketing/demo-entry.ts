"use server";

import { redirect } from "next/navigation";
import { activeArtistGuidedJourneyId } from "@/lib/artist-guided-demo";
import { activeGuidedJourneyId, getGuidedJourney, resolveGuidedRoute } from "@/lib/guided-demo";
import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { demoModeEnabled } from "@/lib/demo-mode";

function redirectToEnterGuidedDemo(returnTo: string): void {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");
  redirect(`/api/demo/enter-guided?returnTo=${encodeURIComponent(returnTo)}`);
}

function fanMarketingDemoReturnTo(): string {
  const journeyId = activeGuidedJourneyId();
  const journey = getGuidedJourney(journeyId);
  const step = journey?.steps[0];
  const show = journey ? getDemoShow(journey.showKey) : undefined;
  if (!step || !show) return "/demo/guided";

  const route = resolveGuidedRoute(step.route, show);
  return `${route}?guided=${journeyId}&step=1`;
}

function artistMarketingDemoReturnTo(): string {
  const journeyId = activeArtistGuidedJourneyId();
  return `/studio/live/${MARISOL_BROOKLYN_EVENT_ID}?guided=${journeyId}&step=1`;
}

/**
 * Marketing's primary artist conversion path: Marisol Artist Studio guided demo.
 *
 * Public marketing entry skips the demo-board access cookie — the board gate
 * still protects manual persona login on /demo for hosted deployments.
 */
export async function experienceArtistStudioAction(): Promise<void> {
  redirectToEnterGuidedDemo(artistMarketingDemoReturnTo());
}

/**
 * Fan-side Marisol guided journey — for /for-fans and fan-focused marketing surfaces.
 */
export async function experienceMarisolReyesFanAction(): Promise<void> {
  redirectToEnterGuidedDemo(fanMarketingDemoReturnTo());
}

/**
 * @deprecated Prefer experienceArtistStudioAction or experienceMarisolReyesFanAction.
 * Routes to the artist studio guided demo for legacy CTAs labeled "See the Artist Demo".
 */
export async function experienceMarisolReyesAction(): Promise<void> {
  redirectToEnterGuidedDemo(artistMarketingDemoReturnTo());
}

/**
 * Legacy Nova entry — retained for bookmarks and pages that still call it.
 * Routes to the active Marisol guided journey.
 */
export async function experienceNovaKestrelAction(): Promise<void> {
  redirectToEnterGuidedDemo(artistMarketingDemoReturnTo());
}

/**
 * Legacy Degens entry — retained for pages that still call it until the approved
 * site fully replaces them.
 */
export async function experienceDegensDetroitAction(): Promise<void> {
  redirectToEnterGuidedDemo(fanMarketingDemoReturnTo());
}

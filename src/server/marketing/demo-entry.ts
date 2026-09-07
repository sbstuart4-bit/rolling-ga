"use server";

import { redirect } from "next/navigation";
import { activeArtistGuidedJourneyId } from "@/lib/artist-guided-demo";
import { activeGuidedJourneyId } from "@/lib/guided-demo";
import { demoModeEnabled } from "@/lib/demo-mode";
import { ensureDevDatabaseReady } from "@/db/dev-bootstrap";
import { startArtistGuidedDemoAction } from "@/server/demo/artist-guided-demo-actions";
import { startGuidedDemoAction } from "@/server/demo/guided-demo-actions";

function redirectIfDemoSeedMissing(error: unknown): never | void {
  if (error instanceof Error && error.message.includes("not seeded")) {
    redirect("/demo/guided?unavailable=seed");
  }
}

function rethrowUnlessRedirect(error: unknown): void {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  ) {
    throw error;
  }
}

async function startPublicFanGuidedDemo(journeyId: string): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  await ensureDevDatabaseReady();

  const formData = new FormData();
  formData.set("journeyId", journeyId);
  formData.set("publicMarketingEntry", "1");

  try {
    await startGuidedDemoAction(formData);
  } catch (error) {
    rethrowUnlessRedirect(error);
    redirectIfDemoSeedMissing(error);
    throw error;
  }
}

async function startPublicArtistGuidedDemo(journeyId: string): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  await ensureDevDatabaseReady();

  const formData = new FormData();
  formData.set("journeyId", journeyId);
  formData.set("publicMarketingEntry", "1");

  try {
    await startArtistGuidedDemoAction(formData);
  } catch (error) {
    rethrowUnlessRedirect(error);
    redirectIfDemoSeedMissing(error);
    throw error;
  }
}

/**
 * Marketing's primary artist conversion path: Marisol Artist Studio guided demo.
 *
 * Public marketing entry skips the demo-board access cookie — the board gate
 * still protects manual persona login on /demo for hosted deployments.
 */
export async function experienceArtistStudioAction(): Promise<void> {
  await startPublicArtistGuidedDemo(activeArtistGuidedJourneyId());
}

/**
 * Fan-side Marisol guided journey — for /for-fans and fan-focused marketing surfaces.
 */
export async function experienceMarisolReyesFanAction(): Promise<void> {
  await startPublicFanGuidedDemo(activeGuidedJourneyId());
}

/**
 * @deprecated Prefer experienceArtistStudioAction or experienceMarisolReyesFanAction.
 * Routes to the artist studio guided demo for legacy CTAs labeled "See the Artist Demo".
 */
export async function experienceMarisolReyesAction(): Promise<void> {
  await startPublicArtistGuidedDemo(activeArtistGuidedJourneyId());
}

/**
 * Legacy Nova entry — retained for bookmarks and pages that still call it.
 * Routes to the active Marisol guided journey.
 */
export async function experienceNovaKestrelAction(): Promise<void> {
  await startPublicArtistGuidedDemo(activeArtistGuidedJourneyId());
}

/**
 * Legacy Degens entry — retained for pages that still call it until the approved
 * site fully replaces them.
 */
export async function experienceDegensDetroitAction(): Promise<void> {
  await startPublicFanGuidedDemo("degens-detroit");
}

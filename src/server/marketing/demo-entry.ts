"use server";

import { redirect } from "next/navigation";
import { ensureDevDatabaseReady } from "@/db/dev-bootstrap";
import { demoModeEnabled } from "@/lib/demo-mode";
import { buildArtistMarketingEnterGuidedHref } from "@/server/marketing/demo-entry-hrefs";
import {
  applyGuidedStepState,
  loadGuidedStepContext,
} from "@/server/demo/guided-demo-apply";
import { redirectToFanGuidedStep } from "@/server/demo/guided-demo-redirect";

const MARKETING_APPLY_OPTIONS = { revalidateLayout: false } as const;

/** Legacy form posts — prefer `<ArtistGuidedDemoLink />` on marketing pages. */
export async function experienceMarisolArtistStudioGuidedAction(): Promise<void> {
  redirect(buildArtistMarketingEnterGuidedHref());
}

/** Public marketing — Marisol Reyes Artist Studio guided demo. */
export async function experienceArtistStudioAction(): Promise<void> {
  await experienceMarisolArtistStudioGuidedAction();
}

/** Homepage hero and artist-studio section — same guided entry as other artist CTAs. */
export async function experienceMarisolArtistStudioAction(): Promise<void> {
  await experienceMarisolArtistStudioGuidedAction();
}

/**
 * Fan-side Marisol guided journey — for /for-fans and fan-focused marketing surfaces.
 */
export async function experienceMarisolReyesFanAction(): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const { activeGuidedJourneyId } = await import("@/lib/guided-demo");

  await ensureDevDatabaseReady();

  const journeyId = activeGuidedJourneyId();
  const ctx = await loadGuidedStepContext(journeyId, 1);
  if (!ctx) redirect("/demo/guided");

  await applyGuidedStepState(ctx, MARKETING_APPLY_OPTIONS);
  redirectToFanGuidedStep(ctx);
}

/**
 * @deprecated Prefer experienceArtistStudioAction or experienceMarisolReyesFanAction.
 */
export async function experienceMarisolReyesAction(): Promise<void> {
  await experienceArtistStudioAction();
}

/** @deprecated Legacy Nova entry — routes to Marisol artist guided demo. */
export async function experienceNovaKestrelAction(): Promise<void> {
  await experienceArtistStudioAction();
}

/** @deprecated Legacy Degens entry — routes to the fan guided journey. */
export async function experienceDegensDetroitAction(): Promise<void> {
  await experienceMarisolReyesFanAction();
}

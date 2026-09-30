"use server";

import { redirect } from "next/navigation";
import { demoModeEnabled } from "@/lib/demo-mode";
import {
  buildArtistMarketingEnterGuidedHref,
  buildFanMarketingEnterGuidedHref,
} from "@/server/marketing/demo-entry-hrefs";

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
  redirect(buildFanMarketingEnterGuidedHref());
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

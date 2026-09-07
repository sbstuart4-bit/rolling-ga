"use server";

import { redirect } from "next/navigation";
import { demoModeEnabled } from "@/lib/demo-mode";
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

/**
 * Marketing's primary conversion path: drop the visitor into the Nova Kestrel
 * guided demo instead of asking them to pick a persona first.
 *
 * Public marketing entry skips the demo-board access cookie — the board gate
 * still protects manual persona login on /demo for hosted deployments.
 */
export async function experienceNovaKestrelAction(): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const formData = new FormData();
  formData.set("journeyId", "nova-nashville");
  formData.set("publicMarketingEntry", "1");

  try {
    await startGuidedDemoAction(formData);
  } catch (error) {
    rethrowUnlessRedirect(error);
    redirectIfDemoSeedMissing(error);
    throw error;
  }
}

/**
 * Legacy Degens entry — retained for pages that still call it until the approved
 * site fully replaces them.
 */
export async function experienceDegensDetroitAction(): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const formData = new FormData();
  formData.set("journeyId", "degens-detroit");
  formData.set("publicMarketingEntry", "1");

  try {
    await startGuidedDemoAction(formData);
  } catch (error) {
    rethrowUnlessRedirect(error);
    redirectIfDemoSeedMissing(error);
    throw error;
  }
}

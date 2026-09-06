"use server";

import { redirect } from "next/navigation";
import { hasDemoBoardAccess } from "@/lib/demo-board-access";
import { demoModeEnabled } from "@/lib/demo-mode";
import { startGuidedDemoAction } from "@/server/demo/guided-demo-actions";

/**
 * Marketing's primary conversion path: drop the visitor into the Nova Kestrel
 * guided demo instead of asking them to pick a persona first.
 *
 * The existing demo gate is checked, never bypassed.
 */
export async function experienceNovaKestrelAction(): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo");
  if (!(await hasDemoBoardAccess())) redirect("/demo");

  const formData = new FormData();
  formData.set("journeyId", "nova-nashville");
  await startGuidedDemoAction(formData);
}

/**
 * Legacy Degens entry — retained for pages that still call it until the approved
 * site fully replaces them.
 */
export async function experienceDegensDetroitAction(): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo");
  if (!(await hasDemoBoardAccess())) redirect("/demo");

  const formData = new FormData();
  formData.set("journeyId", "degens-detroit");
  await startGuidedDemoAction(formData);
}

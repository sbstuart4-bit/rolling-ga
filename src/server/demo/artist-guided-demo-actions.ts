"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hasDemoBoardAccess } from "@/lib/demo-board-access";
import {
  activeArtistGuidedJourneyId,
  getArtistGuidedJourney,
  normalizeArtistGuidedJourneyId,
  type ArtistGuidedJourneyId,
} from "@/lib/artist-guided-demo";
import { demoModeEnabled } from "@/lib/demo-mode";
import {
  applyArtistGuidedStepState,
  loadArtistGuidedStepContext,
} from "./artist-guided-demo-apply";
import {
  artistGuidedDemoQuery,
  clearArtistGuidedDemoSession,
  resolveArtistGuidedStepRoute,
  setArtistGuidedDemoSession,
  type ActiveArtistGuidedDemoContext,
} from "./artist-guided-demo-state";

function redirectToArtistStep(ctx: ActiveArtistGuidedDemoContext): never {
  const route = resolveArtistGuidedStepRoute(ctx.step);
  const qs = artistGuidedDemoQuery(ctx.session);
  const join = route.includes("?") ? "&" : "?";
  redirect(`${route}${join}${qs}`);
}

function journeyIdFromForm(formData: FormData): ArtistGuidedJourneyId | null {
  return normalizeArtistGuidedJourneyId(String(formData.get("journeyId") ?? "")) ?? null;
}

export async function startArtistGuidedDemoAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const publicMarketingEntry = formData.get("publicMarketingEntry") === "1";
  if (!publicMarketingEntry && !(await hasDemoBoardAccess())) redirect("/demo");

  const journeyId = journeyIdFromForm(formData) ?? activeArtistGuidedJourneyId();
  const presenter = formData.get("presenter") === "1";

  const ctx = await loadArtistGuidedStepContext(journeyId, 1, { presenter });
  if (!ctx) redirect("/demo/guided");

  await applyArtistGuidedStepState(ctx);
  redirectToArtistStep(ctx);
}

export async function artistGuidedDemoNextAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const journeyId = journeyIdFromForm(formData);
  if (!journeyId) redirect("/demo/guided");
  const currentStep = Number.parseInt(String(formData.get("step") ?? "1"), 10);
  const journey = getArtistGuidedJourney(journeyId);
  if (!journey) redirect("/demo/guided");

  if (currentStep >= journey.steps.length) {
    redirect("/studio/insights?guided=complete");
  }

  const nextStep = currentStep + 1;
  const ctx = await loadArtistGuidedStepContext(journeyId, nextStep);
  if (!ctx) redirect("/demo/guided");

  await applyArtistGuidedStepState(ctx);
  redirectToArtistStep(ctx);
}

export async function artistGuidedDemoPrevAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const journeyId = journeyIdFromForm(formData);
  if (!journeyId) redirect("/demo/guided");
  const currentStep = Number.parseInt(String(formData.get("step") ?? "1"), 10);
  const prevStep = Math.max(1, currentStep - 1);

  const ctx = await loadArtistGuidedStepContext(journeyId, prevStep);
  if (!ctx) redirect("/demo/guided");

  await applyArtistGuidedStepState(ctx);
  redirectToArtistStep(ctx);
}

export async function artistGuidedDemoGoToStepAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const journeyId = journeyIdFromForm(formData);
  if (!journeyId) redirect("/demo/guided");
  const stepNumber = Number.parseInt(String(formData.get("step") ?? "1"), 10);

  const ctx = await loadArtistGuidedStepContext(journeyId, stepNumber);
  if (!ctx) redirect("/demo/guided");

  await applyArtistGuidedStepState(ctx);
  redirectToArtistStep(ctx);
}

export async function toggleArtistGuidedDemoAutoplayAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const journeyId = journeyIdFromForm(formData);
  if (!journeyId) return;
  const step = Number.parseInt(String(formData.get("step") ?? "1"), 10);
  const autoplay = formData.get("autoplay") === "1";

  const ctx = await loadArtistGuidedStepContext(journeyId, step, { autoplay });
  if (!ctx) return;

  await setArtistGuidedDemoSession(ctx.session);
  revalidatePath("/", "layout");
}

export async function toggleArtistGuidedDemoPresenterAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const journeyId = journeyIdFromForm(formData);
  if (!journeyId) return;
  const step = Number.parseInt(String(formData.get("step") ?? "1"), 10);
  const presenter = formData.get("presenter") === "1";

  const ctx = await loadArtistGuidedStepContext(journeyId, step, { presenter });
  if (!ctx) return;

  await setArtistGuidedDemoSession(ctx.session);
  revalidatePath("/", "layout");
}

export async function exitArtistGuidedDemoAction(): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");
  await clearArtistGuidedDemoSession();
  revalidatePath("/", "layout");
  redirect("/studio/insights");
}

export async function completeArtistGuidedDemoAction(): Promise<void> {
  await clearArtistGuidedDemoSession();
  revalidatePath("/", "layout");
  redirect("/studio/insights");
}

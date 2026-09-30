"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureDevDatabaseReady } from "@/db/dev-bootstrap";
import { hasDemoBoardAccess } from "@/lib/demo-board-access";
import { redirectAfterLeavingDemoSession } from "@/server/demo/demo-exit-redirect";
import { demoModeEnabled } from "@/lib/demo-mode";
import {
  getGuidedJourney,
  getGuidedStep,
  normalizeGuidedJourneyId,
  type GuidedJourneyId,
} from "@/lib/guided-demo";
import {
  applyGuidedStepState,
  ensureScottSession,
  loadGuidedStepContext,
} from "./guided-demo-apply";
import {
  clearGuidedDemoSession,
  setGuidedDemoSession,
} from "./guided-demo-state";
import { redirectToFanGuidedStep } from "./guided-demo-redirect";

function journeyIdFromForm(formData: FormData): GuidedJourneyId | null {
  return normalizeGuidedJourneyId(String(formData.get("journeyId") ?? "")) ?? null;
}

export async function startGuidedDemoAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");
  await ensureDevDatabaseReady();

  const publicMarketingEntry = formData.get("publicMarketingEntry") === "1";
  if (!publicMarketingEntry && !(await hasDemoBoardAccess())) redirect("/demo");

  const journeyId = journeyIdFromForm(formData);
  if (!journeyId) redirect("/demo/guided");
  const presenter = formData.get("presenter") === "1";

  const ctx = await loadGuidedStepContext(journeyId, 1, { presenter });
  if (!ctx) redirect("/demo/guided");

  await applyGuidedStepState(ctx, { revalidateLayout: false });
  redirectToFanGuidedStep(ctx);
}

export async function guidedDemoNextAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");
  await ensureDevDatabaseReady();

  const journeyId = journeyIdFromForm(formData);
  if (!journeyId) redirect("/demo/guided");
  const currentStep = Number.parseInt(String(formData.get("step") ?? "1"), 10);
  const journey = getGuidedJourney(journeyId);
  if (!journey) redirect("/demo/guided");

  if (currentStep >= journey.steps.length) {
    if (await hasDemoBoardAccess()) {
      redirect("/demo/guided?complete=1");
    }
    await clearGuidedDemoSession();
    redirect("/home");
  }

  const nextStep = currentStep + 1;
  const ctx = await loadGuidedStepContext(journeyId, nextStep);
  if (!ctx) redirect("/demo/guided");

  await applyGuidedStepState(ctx);
  redirectToFanGuidedStep(ctx);
}

export async function guidedDemoPrevAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");
  await ensureDevDatabaseReady();

  const journeyId = journeyIdFromForm(formData);
  if (!journeyId) redirect("/demo/guided");
  const currentStep = Number.parseInt(String(formData.get("step") ?? "1"), 10);
  const prevStep = Math.max(1, currentStep - 1);

  const ctx = await loadGuidedStepContext(journeyId, prevStep);
  if (!ctx) redirect("/demo/guided");

  await applyGuidedStepState(ctx);
  redirectToFanGuidedStep(ctx);
}

export async function guidedDemoGoToStepAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");
  await ensureDevDatabaseReady();

  const journeyId = journeyIdFromForm(formData);
  if (!journeyId) redirect("/demo/guided");
  const stepNumber = Number.parseInt(String(formData.get("step") ?? "1"), 10);

  const ctx = await loadGuidedStepContext(journeyId, stepNumber);
  if (!ctx) redirect("/demo/guided");

  await applyGuidedStepState(ctx);
  redirectToFanGuidedStep(ctx);
}

export async function toggleGuidedDemoAutoplayAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const journeyId = journeyIdFromForm(formData);
  if (!journeyId) return;
  const step = Number.parseInt(String(formData.get("step") ?? "1"), 10);
  const autoplay = formData.get("autoplay") === "1";

  const ctx = await loadGuidedStepContext(journeyId, step, { autoplay });
  if (!ctx) return;

  await setGuidedDemoSession(ctx.session);
  revalidatePath("/", "layout");
}

export async function toggleGuidedDemoPresenterAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const journeyId = journeyIdFromForm(formData);
  if (!journeyId) return;
  const step = Number.parseInt(String(formData.get("step") ?? "1"), 10);
  const presenter = formData.get("presenter") === "1";

  const ctx = await loadGuidedStepContext(journeyId, step, { presenter });
  if (!ctx) return;

  await setGuidedDemoSession(ctx.session);
  revalidatePath("/", "layout");
}

export async function exitGuidedDemoAction(): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");
  await clearGuidedDemoSession();
  revalidatePath("/", "layout");
  await redirectAfterLeavingDemoSession();
}

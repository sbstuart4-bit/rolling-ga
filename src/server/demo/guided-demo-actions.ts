"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hasDemoBoardAccess } from "@/lib/demo-board-access";
import { demoModeEnabled } from "@/lib/demo-mode";
import {
  getGuidedJourney,
  getGuidedStep,
  resolveGuidedRoute,
  type GuidedJourneyId,
} from "@/lib/guided-demo";
import {
  applyGuidedStepState,
  ensureScottSession,
  loadGuidedStepContext,
} from "./guided-demo-apply";
import {
  clearGuidedDemoSession,
  guidedDemoQuery,
  setGuidedDemoSession,
  type ActiveGuidedDemoContext,
} from "./guided-demo-state";

function redirectToStep(ctx: ActiveGuidedDemoContext): never {
  const route = resolveGuidedRoute(ctx.step.route, ctx.show);
  const qs = guidedDemoQuery(ctx.session);
  const join = route.includes("?") ? "&" : "?";
  redirect(`${route}${join}${qs}`);
}

export async function startGuidedDemoAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");
  if (!(await hasDemoBoardAccess())) redirect("/demo");

  const journeyId = String(formData.get("journeyId") ?? "") as GuidedJourneyId;
  const presenter = formData.get("presenter") === "1";

  const ctx = await loadGuidedStepContext(journeyId, 1, { presenter });
  if (!ctx) redirect("/demo/guided");

  await applyGuidedStepState(ctx);
  redirectToStep(ctx);
}

export async function guidedDemoNextAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");

  const journeyId = String(formData.get("journeyId") ?? "") as GuidedJourneyId;
  const currentStep = Number.parseInt(String(formData.get("step") ?? "1"), 10);
  const journey = getGuidedJourney(journeyId);
  if (!journey) redirect("/demo/guided");

  if (currentStep >= journey.steps.length) {
    redirect("/demo/guided?complete=1");
  }

  const nextStep = currentStep + 1;
  const ctx = await loadGuidedStepContext(journeyId, nextStep);
  if (!ctx) redirect("/demo/guided");

  await applyGuidedStepState(ctx);
  redirectToStep(ctx);
}

export async function guidedDemoPrevAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");

  const journeyId = String(formData.get("journeyId") ?? "") as GuidedJourneyId;
  const currentStep = Number.parseInt(String(formData.get("step") ?? "1"), 10);
  const prevStep = Math.max(1, currentStep - 1);

  const ctx = await loadGuidedStepContext(journeyId, prevStep);
  if (!ctx) redirect("/demo/guided");

  await applyGuidedStepState(ctx);
  redirectToStep(ctx);
}

export async function guidedDemoGoToStepAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");

  const journeyId = String(formData.get("journeyId") ?? "") as GuidedJourneyId;
  const stepNumber = Number.parseInt(String(formData.get("step") ?? "1"), 10);

  const ctx = await loadGuidedStepContext(journeyId, stepNumber);
  if (!ctx) redirect("/demo/guided");

  await applyGuidedStepState(ctx);
  redirectToStep(ctx);
}

export async function toggleGuidedDemoAutoplayAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");

  const journeyId = String(formData.get("journeyId") ?? "") as GuidedJourneyId;
  const step = Number.parseInt(String(formData.get("step") ?? "1"), 10);
  const autoplay = formData.get("autoplay") === "1";

  const ctx = await loadGuidedStepContext(journeyId, step, { autoplay });
  if (!ctx) return;

  await setGuidedDemoSession(ctx.session);
  revalidatePath("/", "layout");
}

export async function toggleGuidedDemoPresenterAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");

  const journeyId = String(formData.get("journeyId") ?? "") as GuidedJourneyId;
  const step = Number.parseInt(String(formData.get("step") ?? "1"), 10);
  const presenter = formData.get("presenter") === "1";

  const ctx = await loadGuidedStepContext(journeyId, step, { presenter });
  if (!ctx) return;

  await setGuidedDemoSession(ctx.session);
  revalidatePath("/", "layout");
}

export async function exitGuidedDemoAction(): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");
  await clearGuidedDemoSession();
  revalidatePath("/", "layout");
  redirect("/demo?perspective=fan");
}

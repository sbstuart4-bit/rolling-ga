import "server-only";

import { cookies } from "next/headers";
import { GUIDED_DEMO_COOKIE } from "@/lib/auth-cookies";
import { demoModeEnabled } from "@/lib/demo-mode";
import {
  getGuidedJourney,
  getGuidedStep,
  type GuidedDemoSession,
  type GuidedDemoStep,
  type GuidedJourneyId,
} from "@/lib/guided-demo";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { buildDemoScenarioContext } from "./scenario-state";
import { resolveMerchExperience } from "@/lib/merch-experience/resolver";
import { demoNow } from "./clock";

export interface ActiveGuidedDemoContext {
  session: GuidedDemoSession;
  journey: NonNullable<ReturnType<typeof getGuidedJourney>>;
  step: GuidedDemoStep;
  show: NonNullable<ReturnType<typeof getDemoShow>>;
}

function encodeSession(session: GuidedDemoSession): string {
  return JSON.stringify(session);
}

function decodeSession(raw: string | undefined): GuidedDemoSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GuidedDemoSession;
    if (!parsed.journeyId || !parsed.step) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getGuidedDemoSession(): Promise<GuidedDemoSession | null> {
  if (!demoModeEnabled()) return null;
  try {
    const jar = await cookies();
    return decodeSession(jar.get(GUIDED_DEMO_COOKIE)?.value);
  } catch {
    return null;
  }
}

export async function setGuidedDemoSession(session: GuidedDemoSession): Promise<void> {
  if (!demoModeEnabled()) return;
  const jar = await cookies();
  jar.set(GUIDED_DEMO_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearGuidedDemoSession(): Promise<void> {
  if (!demoModeEnabled()) return;
  const jar = await cookies();
  jar.delete(GUIDED_DEMO_COOKIE);
}

export async function syncGuidedDemoFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): Promise<void> {
  const guided = typeof params.guided === "string" ? params.guided : undefined;
  const stepRaw = typeof params.step === "string" ? params.step : undefined;
  const step = stepRaw ? Number.parseInt(stepRaw, 10) : NaN;
  if (!guided || !Number.isFinite(step) || step < 1) return;

  const journey = getGuidedJourney(guided);
  if (!journey) return;

  const existing = await getGuidedDemoSession();
  await setGuidedDemoSession({
    journeyId: journey.id as GuidedJourneyId,
    step,
    autoplay: existing?.autoplay ?? false,
    presenter: existing?.presenter ?? params.presenter === "1",
  });
}

export async function getActiveGuidedDemoContext(): Promise<ActiveGuidedDemoContext | null> {
  const session = await getGuidedDemoSession();
  if (!session) return null;

  const journey = getGuidedJourney(session.journeyId);
  const step = getGuidedStep(session.journeyId, session.step);
  const show = journey ? getDemoShow(journey.showKey) : undefined;
  if (!journey || !step || !show) return null;

  return { session, journey, step, show };
}

/** Expected merch diagnostic for a guided step — used by tests and presenter panel. */
export function guidedStepMerchLabel(step: GuidedDemoStep): string {
  const show = getDemoShow(step.scenario.showKey);
  if (!show) return "unknown";
  const ctx = buildDemoScenarioContext(step.scenario);
  if (!ctx) return "unknown";
  const experience = resolveMerchExperience({
    now: demoNow(),
    show: ctx.show,
    timePhase: step.scenario.timePhase,
    fanState: step.scenario.fanState,
    location: step.scenario.location,
    fanHistory: step.scenario.fanHistory,
    purchaseHistory: step.scenario.purchaseHistory,
    merchRule: step.scenario.merchRule,
  });
  if (experience.showExclusiveVisibility === "teaser") return "TEASER ONLY";
  if (!experience.showExclusivePurchasable && experience.showExclusiveVisibility !== "hidden") {
    return "VISIBLE + LOCKED";
  }
  if (experience.showExclusivePurchasable) return "UNLOCKED";
  if (experience.liveDropVisible) return "LIVE DROP";
  if (experience.phase.startsWith("post")) return "POST-SHOW";
  return experience.primaryMessage;
}

export function guidedDemoQuery(session: GuidedDemoSession): string {
  const params = new URLSearchParams({
    guided: session.journeyId,
    step: String(session.step),
  });
  if (session.presenter) params.set("presenter", "1");
  if (session.autoplay) params.set("autoplay", "1");
  return params.toString();
}

import "server-only";

import { cookies } from "next/headers";
import { GUIDED_DEMO_COOKIE } from "@/lib/auth-cookies";
import { demoModeEnabled } from "@/lib/demo-mode";
import {
  experienceAccessLabel,
  resolveFanExperienceState,
  timingStateForDemoPhase,
  type FanExperienceState,
} from "@/lib/fan-experience/access-state";
import {
  getGuidedJourney,
  getGuidedStep,
  type GuidedDemoSession,
  type GuidedDemoStep,
  type GuidedJourneyId,
} from "@/lib/guided-demo";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { DEMO_TIME_PHASE_LABELS } from "@/lib/demo-scenario/time-phases";
import { DEMO_FAN_STATE_LABELS, DEMO_LOCATION_LABELS } from "@/lib/demo-scenario/url";
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

export function resolveGuidedStepFanExperience(step: GuidedDemoStep): FanExperienceState | null {
  const show = getDemoShow(step.scenario.showKey);
  if (!show) return null;
  const timingState = timingStateForDemoPhase(step.scenario.timePhase);
  return resolveFanExperienceState({
    eventId: show.eventId,
    scenario: step.scenario,
    realVerified: false,
    timingState,
    storeOpen: timingState !== "archived",
    now: demoNow(),
  });
}

/** Canonical access label for a guided step — used by tests and presenter panel. */
export function guidedStepMerchLabel(step: GuidedDemoStep): string {
  const fanExperience = resolveGuidedStepFanExperience(step);
  if (!fanExperience) return "unknown";
  return experienceAccessLabel(fanExperience.access);
}

export function guidedStepContextSummary(step: GuidedDemoStep) {
  const fanExperience = resolveGuidedStepFanExperience(step);
  return {
    timeLabel: DEMO_TIME_PHASE_LABELS[step.scenario.timePhase],
    fanLabel: DEMO_FAN_STATE_LABELS[step.scenario.fanState],
    locationLabel: DEMO_LOCATION_LABELS[step.scenario.location],
    accessLabel: fanExperience ? experienceAccessLabel(fanExperience.access) : "unknown",
    credentialLabel: fanExperience?.credential === "earned" ? "Credential earned" : "No credential yet",
    purchaseLabel:
      fanExperience?.purchase === "completed" ? "Purchase completed" : "No purchase yet",
    fanExperience,
  };
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

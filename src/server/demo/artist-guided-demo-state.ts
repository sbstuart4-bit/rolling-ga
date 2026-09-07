import "server-only";

import { cookies } from "next/headers";
import { GUIDED_DEMO_COOKIE } from "@/lib/auth-cookies";
import {
  getArtistGuidedJourney,
  getArtistGuidedStep,
  isArtistGuidedJourney,
  resolveArtistGuidedRoute,
  type ArtistGuidedDemoSession,
  type ArtistGuidedDemoStep,
  type ArtistGuidedJourneyId,
} from "@/lib/artist-guided-demo";
import { MARISOL_BROOKLYN_EVENT_ID, DEMO_SCOTT_FAN_ID } from "@/lib/demo-user-ids";
import { demoModeEnabled } from "@/lib/demo-mode";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { DEMO_TIME_PHASE_LABELS } from "@/lib/demo-scenario/time-phases";

export interface ActiveArtistGuidedDemoContext {
  session: ArtistGuidedDemoSession;
  journey: NonNullable<ReturnType<typeof getArtistGuidedJourney>>;
  step: ArtistGuidedDemoStep;
  show: NonNullable<ReturnType<typeof getDemoShow>>;
}

function encodeSession(session: ArtistGuidedDemoSession): string {
  return JSON.stringify(session);
}

function decodeSession(raw: string | undefined): ArtistGuidedDemoSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ArtistGuidedDemoSession;
    if (!parsed.journeyId || !parsed.step || !isArtistGuidedJourney(parsed.journeyId)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getArtistGuidedDemoSession(): Promise<ArtistGuidedDemoSession | null> {
  if (!demoModeEnabled()) return null;
  try {
    const jar = await cookies();
    return decodeSession(jar.get(GUIDED_DEMO_COOKIE)?.value);
  } catch {
    return null;
  }
}

export async function setArtistGuidedDemoSession(session: ArtistGuidedDemoSession): Promise<void> {
  if (!demoModeEnabled()) return;
  const jar = await cookies();
  jar.set(GUIDED_DEMO_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearArtistGuidedDemoSession(): Promise<void> {
  if (!demoModeEnabled()) return;
  const jar = await cookies();
  jar.delete(GUIDED_DEMO_COOKIE);
}

export async function getActiveArtistGuidedDemoContext(): Promise<ActiveArtistGuidedDemoContext | null> {
  const session = await getArtistGuidedDemoSession();
  if (!session) return null;

  const journey = getArtistGuidedJourney(session.journeyId);
  const step = getArtistGuidedStep(session.journeyId, session.step);
  const show = journey ? getDemoShow(journey.showKey) : undefined;
  if (!journey || !step || !show) return null;

  return { session, journey, step, show };
}

export function artistGuidedStepContextSummary(step: ArtistGuidedDemoStep) {
  return {
    timeLabel: DEMO_TIME_PHASE_LABELS[step.timePhase],
    showLabel: "Marisol Reyes · Brooklyn",
  };
}

export function artistGuidedDemoQuery(session: ArtistGuidedDemoSession): string {
  const params = new URLSearchParams({
    guided: session.journeyId,
    step: String(session.step),
  });
  if (session.presenter) params.set("presenter", "1");
  if (session.autoplay) params.set("autoplay", "1");
  return params.toString();
}

export function resolveArtistGuidedStepRoute(step: ArtistGuidedDemoStep): string {
  return resolveArtistGuidedRoute(step.route, {
    eventId: MARISOL_BROOKLYN_EVENT_ID,
    fanId: DEMO_SCOTT_FAN_ID,
  });
}

export async function syncArtistGuidedDemoFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): Promise<void> {
  const guided = typeof params.guided === "string" ? params.guided : undefined;
  const stepRaw = typeof params.step === "string" ? params.step : undefined;
  const step = stepRaw ? Number.parseInt(stepRaw, 10) : NaN;
  if (!guided || !isArtistGuidedJourney(guided) || !Number.isFinite(step) || step < 1) return;

  const journey = getArtistGuidedJourney(guided);
  if (!journey) return;

  const existing = await getArtistGuidedDemoSession();
  await setArtistGuidedDemoSession({
    journeyId: journey.id as ArtistGuidedJourneyId,
    step,
    autoplay: existing?.autoplay ?? false,
    presenter: existing?.presenter ?? params.presenter === "1",
  });
}

import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  getGuidedJourney,
  getGuidedStep,
  type GuidedJourneyId,
} from "@/lib/guided-demo";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { demoClockForTimePhase } from "@/lib/demo-scenario/time-phases";
import { createSession, destroySession } from "@/server/auth/session";
import { getActiveEventToken } from "@/server/events/queries";
import { setFanShowContextSlug } from "@/server/fans/show-context";
import { verifyAttendance } from "@/server/verification/service";
import { staffCodeForToken } from "@/server/verification/verifiers";
import { setDemoClockDaysAndHours } from "./clock";
import { setDemoScenarioCookie } from "./scenario-state";
import {
  getGuidedDemoSession,
  setGuidedDemoSession,
  type ActiveGuidedDemoContext,
} from "./guided-demo-state";

const SCOTT_EMAIL = "scott@example.com";

export async function ensureScottSession(): Promise<string> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SCOTT_EMAIL))
    .limit(1);
  if (!user) throw new Error("Demo fan Scott Weller is not seeded.");
  await destroySession();
  await createSession(user.id);
  return user.id;
}

export async function loadGuidedStepContext(
  journeyId: GuidedJourneyId,
  stepNumber: number,
  flags?: { autoplay?: boolean; presenter?: boolean },
): Promise<ActiveGuidedDemoContext | null> {
  const journey = getGuidedJourney(journeyId);
  const step = getGuidedStep(journeyId, stepNumber);
  const show = journey ? getDemoShow(journey.showKey) : undefined;
  if (!journey || !step || !show) return null;

  const existing = await getGuidedDemoSession();

  return {
    journey,
    step,
    show,
    session: {
      journeyId,
      step: stepNumber,
      autoplay: flags?.autoplay ?? existing?.autoplay ?? false,
      presenter: flags?.presenter ?? existing?.presenter ?? false,
    },
  };
}

export async function applyGuidedStepState(ctx: ActiveGuidedDemoContext): Promise<void> {
  const { step, show, session } = ctx;

  const { days, hours } = demoClockForTimePhase(show, step.scenario.timePhase);
  setDemoClockDaysAndHours(days, hours);
  await setDemoScenarioCookie(step.scenario);
  await setFanShowContextSlug(show.slug);

  if (step.verifyAttendance) {
    const userId = await ensureScottSession();
    const token = await getActiveEventToken(show.eventId);
    if (token) {
      await verifyAttendance("staff_override", {
        userId,
        eventId: show.eventId,
        staffCode: staffCodeForToken(token.token),
      });
    }
  } else {
    await ensureScottSession();
  }

  await setGuidedDemoSession(session);
  revalidatePath("/", "layout");
}

export async function ensureGuidedDemoFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): Promise<ActiveGuidedDemoContext | null> {
  const guided = typeof params.guided === "string" ? params.guided : undefined;
  const stepRaw = typeof params.step === "string" ? params.step : undefined;
  const step = stepRaw ? Number.parseInt(stepRaw, 10) : NaN;
  if (!guided || !Number.isFinite(step) || step < 1) {
    return null;
  }

  const presenter = params.presenter === "1";
  const autoplay = params.autoplay === "1";
  const ctx = await loadGuidedStepContext(guided as GuidedJourneyId, step, { presenter, autoplay });
  if (!ctx) return null;

  await applyGuidedStepState(ctx);
  return ctx;
}

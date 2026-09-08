import "server-only";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { withDevDatabaseRecovery } from "@/db/dev-bootstrap";
import { users } from "@/db/schema";
import {
  getArtistGuidedJourney,
  getArtistGuidedStep,
  type ArtistGuidedJourneyId,
} from "@/lib/artist-guided-demo";
import { MARISOL_ARTIST_ID } from "@/lib/demo-user-ids";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import {
  createSession,
  destroySession,
  getAuthContext,
  setActiveArtist,
} from "@/server/auth/session";
import {
  isElenaMarisolDemoSession,
  repairElenaMarisolDemoAccount,
} from "@/server/demo/ensure-demo-personas";
import { applyDemoClockForPhase, applyDemoClockForPhaseInMemory } from "./apply-demo-clock";
import {
  getArtistGuidedDemoSession,
  setArtistGuidedDemoSession,
  type ActiveArtistGuidedDemoContext,
} from "./artist-guided-demo-state";

const ELENA_EMAIL = "elena@marisolreyes.example";

export { isElenaMarisolDemoSession } from "@/server/demo/ensure-demo-personas";

export async function ensureElenaSession(): Promise<string> {
  return withDevDatabaseRecovery(async () => {
    await repairElenaMarisolDemoAccount();

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, ELENA_EMAIL))
      .limit(1);
    if (!user) throw new Error("Demo artist team member Elena Vasquez is not seeded.");

    await destroySession();
    await createSession(user.id);

    const ctx = await getAuthContext();
    if (!ctx) throw new Error("Could not establish Elena demo session.");
    if (!isElenaMarisolDemoSession(ctx)) {
      throw new Error("Demo artist team member Elena Vasquez is not seeded.");
    }
    await setActiveArtist(ctx.sessionId, MARISOL_ARTIST_ID);

    return user.id;
  });
}

export async function loadArtistGuidedStepContext(
  journeyId: ArtistGuidedJourneyId,
  stepNumber: number,
  flags?: { autoplay?: boolean; presenter?: boolean },
): Promise<ActiveArtistGuidedDemoContext | null> {
  const journey = getArtistGuidedJourney(journeyId);
  const step = getArtistGuidedStep(journeyId, stepNumber);
  const show = journey ? getDemoShow(journey.showKey) : undefined;
  if (!journey || !step || !show) return null;

  const existing = await getArtistGuidedDemoSession();

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

export async function applyArtistGuidedStepState(ctx: ActiveArtistGuidedDemoContext): Promise<void> {
  const { step, show, session } = ctx;

  await applyDemoClockForPhase(show, step.timePhase);
  await ensureElenaSession();
  await setArtistGuidedDemoSession(session);
  revalidatePath("/", "layout");
}

export async function ensureArtistGuidedDemoFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): Promise<ActiveArtistGuidedDemoContext | null> {
  const guided = typeof params.guided === "string" ? params.guided : undefined;
  const stepRaw = typeof params.step === "string" ? params.step : undefined;
  const step = stepRaw ? Number.parseInt(stepRaw, 10) : NaN;
  if (!guided || !Number.isFinite(step) || step < 1) {
    return null;
  }

  const presenter = params.presenter === "1";
  const autoplay = params.autoplay === "1";
  const ctx = await loadArtistGuidedStepContext(guided as ArtistGuidedJourneyId, step, {
    presenter,
    autoplay,
  });
  if (!ctx) return null;

  await applyArtistGuidedStepState(ctx);
  return ctx;
}

/** Re-applies the artist guided step clock in-memory on studio requests. */
export function syncArtistGuidedDemoClock(ctx: ActiveArtistGuidedDemoContext): void {
  applyDemoClockForPhaseInMemory(ctx.show, ctx.step.timePhase);
}

"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { withDevDatabaseRecovery } from "@/db/dev-bootstrap";
import { users } from "@/db/schema";
import { MARISOL_ARTIST_ID, THE_DEGENS_ARTIST_ID } from "@/lib/demo-user-ids";
import { demoModeEnabled } from "@/lib/demo-mode";
import {
  ELENA_MARISOL_EMAIL,
  getPersonaDestination,
  MARCUS_VALE_EMAIL,
} from "@/server/demo/persona-destinations";
import {
  repairElenaMarisolDemoAccount,
  repairMarcusValeDemoAccount,
} from "@/server/demo/ensure-demo-personas";
import {
  createSession,
  destroySession,
  getAuthContext,
  setActiveArtist,
} from "@/server/auth/session";

const PERSONA_ACTIVE_ARTIST: Record<string, string> = {
  [MARCUS_VALE_EMAIL]: THE_DEGENS_ARTIST_ID,
  [ELENA_MARISOL_EMAIL]: MARISOL_ARTIST_ID,
};

const PERSONA_REPAIR: Partial<Record<string, () => Promise<boolean>>> = {
  [MARCUS_VALE_EMAIL]: repairMarcusValeDemoAccount,
  [ELENA_MARISOL_EMAIL]: repairElenaMarisolDemoAccount,
};

/**
 * Signs in as a curated demo persona from marketing CTAs — no password or demo-board
 * access cookie required. Bootstraps and repairs the persona before signing in.
 */
async function enterDemoPersona(email: string): Promise<void> {
  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const destination = getPersonaDestination(email);
  if (!destination) redirect("/demo");

  await withDevDatabaseRecovery(async () => {
    await PERSONA_REPAIR[email]?.();

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user) redirect("/demo/guided?unavailable=seed");

    await destroySession();
    await createSession(user.id);

    const activeArtist = PERSONA_ACTIVE_ARTIST[email];
    if (activeArtist) {
      const ctx = await getAuthContext();
      if (ctx) await setActiveArtist(ctx.sessionId, activeArtist);
    }

    redirect(destination);
  });
}

/**
 * Marketing artist conversion — Marcus Vale in The Degens Artist Studio.
 */
export async function experienceArtistStudioAction(): Promise<void> {
  await enterDemoPersona(MARCUS_VALE_EMAIL);
}

/**
 * Homepage hero — Elena Vasquez in Marisol Reyes Artist Studio (Brooklyn live show).
 */
export async function experienceMarisolArtistStudioAction(): Promise<void> {
  await enterDemoPersona(ELENA_MARISOL_EMAIL);
}

/**
 * Fan-side Marisol guided journey — for /for-fans and fan-focused marketing surfaces.
 */
export async function experienceMarisolReyesFanAction(): Promise<void> {
  const { activeGuidedJourneyId, getGuidedJourney, resolveGuidedRoute } = await import(
    "@/lib/guided-demo"
  );
  const { getDemoShow } = await import("@/lib/demo-scenario/shows");

  if (!demoModeEnabled()) redirect("/demo/guided?unavailable=1");

  const journeyId = activeGuidedJourneyId();
  const journey = getGuidedJourney(journeyId);
  const step = journey?.steps[0];
  const show = journey ? getDemoShow(journey.showKey) : undefined;
  if (!step || !show) redirect("/demo/guided");

  const route = resolveGuidedRoute(step.route, show);
  redirect(`/api/demo/enter-guided?returnTo=${encodeURIComponent(`${route}?guided=${journeyId}&step=1`)}`);
}

/**
 * @deprecated Prefer experienceArtistStudioAction or experienceMarisolReyesFanAction.
 */
export async function experienceMarisolReyesAction(): Promise<void> {
  await experienceArtistStudioAction();
}

/** @deprecated Legacy Nova entry — routes to Marcus Vale Artist Studio. */
export async function experienceNovaKestrelAction(): Promise<void> {
  await experienceArtistStudioAction();
}

/** @deprecated Legacy Degens entry — routes to the fan guided journey. */
export async function experienceDegensDetroitAction(): Promise<void> {
  await experienceMarisolReyesFanAction();
}

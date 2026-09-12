"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hasDemoBoardAccess } from "@/lib/demo-board-access";
import { createSession, destroySession } from "@/server/auth/session";
import { demoMarisolBrooklynEventSlug } from "@/lib/demo-calendar";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { applyDemoClockForPhase } from "./apply-demo-clock";
import { setFanShowContextSlug } from "@/server/fans/show-context";
import {
  getPersonaDestination,
  MARCUS_VALE_EMAIL,
} from "@/server/demo/persona-destinations";
import { repairMarcusValeDemoAccount } from "@/server/demo/ensure-demo-personas";
import { demoModeEnabled } from "./accounts";

const SCOTT_EMAIL = "scott@example.com";

/**
 * Signs straight in as a curated demo persona — no password required. This only ever
 * works in demo mode, and only for the handful of accounts on the demo board, never for
 * the crowd fill data that backs the CRM and insights numbers.
 */
export async function startPersonaAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");
  if (!(await hasDemoBoardAccess())) redirect("/demo");

  const email = String(formData.get("email") ?? "");
  const destination = getPersonaDestination(email);
  if (!destination) redirect("/demo");

  if (email === MARCUS_VALE_EMAIL) {
    await repairMarcusValeDemoAccount();
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!user) redirect("/demo");

  await destroySession();
  await createSession(user.id);
  redirect(destination);
}

/** One-click fan walkthrough: Brooklyn live on the demo clock, signed in as Scott. */
export async function startScottMarisolBrooklynLiveAction(): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");
  if (!(await hasDemoBoardAccess())) redirect("/demo");

  const show = getDemoShow("marisol-brooklyn")!;
  await applyDemoClockForPhase(show, "headliner");

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SCOTT_EMAIL))
    .limit(1);
  if (!user) redirect("/demo");

  await destroySession();
  await createSession(user.id);
  await setFanShowContextSlug(demoMarisolBrooklynEventSlug());
  redirect(`/event/${demoMarisolBrooklynEventSlug()}`);
}

/** @deprecated Use startScottMarisolBrooklynLiveAction — legacy Nova Nashville entry. */
export async function startScottNovaNashvilleLiveAction(): Promise<void> {
  await startScottMarisolBrooklynLiveAction();
}

/** @deprecated Degens Detroit walkthrough — use startScottMarisolBrooklynLiveAction. */
export async function startScottDetroitLiveAction(): Promise<void> {
  const { demoDetroitEventSlug } = await import("@/lib/demo-calendar");
  if (!demoModeEnabled()) redirect("/welcome");
  if (!(await hasDemoBoardAccess())) redirect("/demo");

  const show = getDemoShow("atlas-detroit")!;
  await applyDemoClockForPhase(show, "headliner");

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SCOTT_EMAIL))
    .limit(1);
  if (!user) redirect("/demo");

  await destroySession();
  await createSession(user.id);
  await setFanShowContextSlug(demoDetroitEventSlug());
  redirect(`/event/${demoDetroitEventSlug()}`);
}

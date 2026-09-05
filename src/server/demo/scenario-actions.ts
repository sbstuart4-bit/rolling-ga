"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hasDemoBoardAccess } from "@/lib/demo-board-access";
import { demoModeEnabled } from "@/lib/demo-mode";
import {
  DEFAULT_DEMO_SCENARIO,
  DEMO_ARTISTS,
  DEMO_FAN_HISTORY,
  DEMO_FAN_STATES,
  DEMO_LOCATION_STATES,
  DEMO_MERCH_RULES,
  DEMO_PURCHASE_HISTORY,
  DEMO_TIME_PHASES,
  type DemoScenario,
} from "@/lib/demo-scenario/types";
import { getDemoScenarioPreset } from "@/lib/demo-scenario/presets";
import { defaultDemoShowForArtist, getDemoShow } from "@/lib/demo-scenario/shows";
import { demoClockForTimePhase } from "@/lib/demo-scenario/time-phases";
import { demoScenarioWithArtist, serializeDemoScenarioToSearchParams } from "@/lib/demo-scenario/url";
import { createSession, destroySession } from "@/server/auth/session";
import { setDemoClockDaysAndHours } from "./clock";
import { setFanShowContextSlug } from "@/server/fans/show-context";
import {
  clearDemoScenarioCookie,
  setDemoScenarioCookie,
} from "./scenario-state";
import { clearFanShowContextSlug } from "@/server/fans/show-context";

const SCOTT_EMAIL = "scott@example.com";

function pickField(formData: FormData, key: string, allowed: readonly string[], fallback: string): string {
  const value = String(formData.get(key) ?? fallback);
  return allowed.includes(value) ? value : fallback;
}

function scenarioFromFormData(formData: FormData): DemoScenario {
  const artist = pickField(formData, "artist", DEMO_ARTISTS, DEFAULT_DEMO_SCENARIO.artist) as DemoScenario["artist"];
  const rawShowKey = String(formData.get("showKey") ?? "");
  const showKey = getDemoShow(rawShowKey) ? rawShowKey : defaultDemoShowForArtist(artist).key;

  return {
    artist,
    showKey,
    timePhase: pickField(formData, "timePhase", DEMO_TIME_PHASES, DEFAULT_DEMO_SCENARIO.timePhase) as DemoScenario["timePhase"],
    fanState: pickField(formData, "fanState", DEMO_FAN_STATES, DEFAULT_DEMO_SCENARIO.fanState) as DemoScenario["fanState"],
    location: pickField(formData, "location", DEMO_LOCATION_STATES, DEFAULT_DEMO_SCENARIO.location) as DemoScenario["location"],
    fanHistory: pickField(formData, "fanHistory", DEMO_FAN_HISTORY, DEFAULT_DEMO_SCENARIO.fanHistory) as DemoScenario["fanHistory"],
    purchaseHistory: pickField(formData, "purchaseHistory", DEMO_PURCHASE_HISTORY, DEFAULT_DEMO_SCENARIO.purchaseHistory) as DemoScenario["purchaseHistory"],
    merchRule: pickField(formData, "merchRule", DEMO_MERCH_RULES, DEFAULT_DEMO_SCENARIO.merchRule) as DemoScenario["merchRule"],
  };
}

async function applyScenario(scenario: DemoScenario): Promise<void> {
  if (!demoModeEnabled()) return;

  const show = getDemoShow(scenario.showKey);
  if (!show) return;

  const { days, hours } = demoClockForTimePhase(show, scenario.timePhase);
  setDemoClockDaysAndHours(days, hours);
  await setDemoScenarioCookie(scenario);

  revalidatePath("/demo");
  revalidatePath("/", "layout");
}

/** Persist scenario + clock without entering fan experience. */
export async function updateDemoScenarioAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");
  const scenario = scenarioFromFormData(formData);
  await applyScenario(scenario);
  redirect(`/demo?${serializeDemoScenarioToSearchParams(scenario).toString()}`);
}

/** Apply scenario, sign in as Scott, and open the real fan event page. */
export async function enterDemoExperienceAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");
  if (!(await hasDemoBoardAccess())) redirect("/demo");

  const scenario = scenarioFromFormData(formData);
  await applyScenario(scenario);

  const show = getDemoShow(scenario.showKey)!;

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SCOTT_EMAIL))
    .limit(1);
  if (!user) redirect("/demo");

  await destroySession();
  await createSession(user.id);
  await setFanShowContextSlug(show.slug);
  redirect(`/event/${show.slug}`);
}

export async function resetDemoScenarioAction(): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");
  await clearDemoScenarioCookie();
  await clearFanShowContextSlug();
  revalidatePath("/demo");
  redirect("/demo");
}

export async function runDemoScenarioPresetAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");
  if (!(await hasDemoBoardAccess())) redirect("/demo");

  const presetId = String(formData.get("presetId") ?? "");
  const preset = getDemoScenarioPreset(presetId);
  if (!preset) redirect("/demo");

  const form = new FormData();
  for (const [key, value] of Object.entries(preset.scenario)) {
    const field =
      key === "showKey"
        ? "showKey"
        : key === "timePhase"
          ? "timePhase"
          : key === "fanState"
            ? "fanState"
            : key === "fanHistory"
              ? "fanHistory"
              : key === "purchaseHistory"
                ? "purchaseHistory"
                : key === "merchRule"
                  ? "merchRule"
                  : key;
    form.set(field, value);
  }
  form.set("artist", preset.scenario.artist);
  await enterDemoExperienceAction(form);
}

/** When artist changes on the board, swap to that artist's default show. */
export async function selectDemoArtistAction(formData: FormData): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");

  const artist = pickField(formData, "artist", DEMO_ARTISTS, DEFAULT_DEMO_SCENARIO.artist) as DemoScenario["artist"];
  const current = scenarioFromFormData(formData);
  const next = demoScenarioWithArtist(artist, current);
  await applyScenario(next);
  redirect(`/demo?${new URLSearchParams({ artist, show: next.showKey, phase: next.timePhase, fan: next.fanState, location: next.location, history: next.fanHistory, purchases: next.purchaseHistory, merch: next.merchRule }).toString()}`);
}

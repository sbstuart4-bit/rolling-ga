import "server-only";

import { cookies } from "next/headers";
import { DEMO_SCENARIO_COOKIE } from "@/lib/auth-cookies";
import { demoModeEnabled } from "@/lib/demo-mode";
import { DEFAULT_DEMO_SCENARIO, type DemoScenario } from "@/lib/demo-scenario/types";
import { parseDemoScenarioFromSearchParams, serializeDemoScenarioToSearchParams } from "@/lib/demo-scenario/url";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { demoNow } from "./clock";
import { resolveMerchExperience } from "@/lib/merch-experience/resolver";
import {
  merchExperienceDiagnosticLabel,
  type MerchExperienceInput,
} from "@/lib/merch-experience/resolver";
import type { MerchExperienceState } from "@/lib/merch-experience/types";
import { resolveTimePhaseDate } from "@/lib/demo-scenario/time-phases";
import { getActiveGuidedDemoContext } from "./guided-demo-state";

export interface DemoScenarioContext {
  scenario: DemoScenario;
  show: NonNullable<ReturnType<typeof getDemoShow>>;
  experience: MerchExperienceState;
  simulatedNow: Date;
}

function encodeScenarioCookie(scenario: DemoScenario): string {
  return serializeDemoScenarioToSearchParams(scenario).toString();
}

function decodeScenarioCookie(raw: string | undefined): DemoScenario | null {
  if (!raw) return null;
  try {
    return parseDemoScenarioFromSearchParams(new URLSearchParams(raw));
  } catch {
    return null;
  }
}

async function readScenarioCookie(): Promise<DemoScenario | null> {
  try {
    const jar = await cookies();
    return decodeScenarioCookie(jar.get(DEMO_SCENARIO_COOKIE)?.value);
  } catch {
    return null;
  }
}

/** Read persisted demo scenario — URL params take precedence over cookie. */
export async function getDemoScenario(
  searchParams?: Record<string, string | string[] | undefined>,
): Promise<DemoScenario> {
  if (!demoModeEnabled()) return DEFAULT_DEMO_SCENARIO;

  if (searchParams && Object.keys(searchParams).length > 0) {
    const fromUrl = parseDemoScenarioFromSearchParams(searchParams);
    if (searchParams.artist || searchParams.show || searchParams.phase) {
      return fromUrl;
    }
  }

  const persisted = await readScenarioCookie();
  return persisted ?? DEFAULT_DEMO_SCENARIO;
}

/** Scenario cookie set by /demo — fan pages only honor this, not the board default. */
export async function getPersistedDemoScenario(): Promise<DemoScenario | null> {
  if (!demoModeEnabled()) return null;
  return readScenarioCookie();
}

/**
 * Active scenario for fan surfaces — guided demo step wins over the board cookie
 * so tab navigation cannot drift from the presenter step.
 */
export async function getEffectiveDemoScenario(): Promise<DemoScenario | null> {
  const guided = await getActiveGuidedDemoContext();
  if (guided) {
    return guided.step.scenario;
  }
  return getPersistedDemoScenario();
}

export async function setDemoScenarioCookie(scenario: DemoScenario): Promise<void> {
  if (!demoModeEnabled()) return;
  const jar = await cookies();
  jar.set(DEMO_SCENARIO_COOKIE, encodeScenarioCookie(scenario), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearDemoScenarioCookie(): Promise<void> {
  if (!demoModeEnabled()) return;
  const jar = await cookies();
  jar.delete(DEMO_SCENARIO_COOKIE);
}

export function buildDemoScenarioContext(scenario: DemoScenario): DemoScenarioContext | null {
  const show = getDemoShow(scenario.showKey);
  if (!show) return null;

  const simulatedNow = resolveTimePhaseDate(show, scenario.timePhase);

  const input: MerchExperienceInput = {
    now: simulatedNow,
    show,
    timePhase: scenario.timePhase,
    fanState: scenario.fanState,
    location: scenario.location,
    fanHistory: scenario.fanHistory,
    purchaseHistory: scenario.purchaseHistory,
    merchRule: scenario.merchRule,
  };

  return {
    scenario,
    show,
    experience: resolveMerchExperience(input),
    simulatedNow,
  };
}

/** Resolve scenario context for fan pages when a scenario cookie is active. */
export async function getActiveDemoScenarioContext(): Promise<DemoScenarioContext | null> {
  if (!demoModeEnabled()) return null;
  const scenario = await getEffectiveDemoScenario();
  if (!scenario) return null;

  const ctx = buildDemoScenarioContext(scenario);
  if (!ctx) return null;

  ctx.experience = resolveMerchExperience({
    now: demoNow(),
    show: ctx.show,
    timePhase: scenario.timePhase,
    fanState: scenario.fanState,
    location: scenario.location,
    fanHistory: scenario.fanHistory,
    purchaseHistory: scenario.purchaseHistory,
    merchRule: scenario.merchRule,
  });

  return ctx;
}

export function formatExpectedExperience(ctx: DemoScenarioContext): {
  artist: string;
  show: string;
  time: string;
  fan: string;
  location: string;
  merchState: string;
  primaryMessage: string;
  why: string;
} {
  const { scenario, show, experience } = ctx;
  return {
    artist: show.artistName,
    show: show.city,
    time: scenario.timePhase.replace(/_/g, " ").toUpperCase(),
    fan: scenario.fanState.replace(/_/g, " "),
    location: scenario.location.replace(/_/g, " "),
    merchState: merchExperienceDiagnosticLabel(experience),
    primaryMessage: experience.primaryMessage,
    why: experience.reason,
  };
}

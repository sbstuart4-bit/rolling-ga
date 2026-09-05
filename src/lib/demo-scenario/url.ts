import type { DemoScenario } from "./types";
import {
  DEFAULT_DEMO_SCENARIO,
  DEMO_ARTISTS,
  DEMO_FAN_HISTORY,
  DEMO_FAN_STATES,
  DEMO_LOCATION_STATES,
  DEMO_MERCH_RULES,
  DEMO_PURCHASE_HISTORY,
  DEMO_TIME_PHASES,
  type DemoArtistKey,
  type DemoFanHistory,
  type DemoFanState,
  type DemoLocationState,
  type DemoMerchRule,
  type DemoPurchaseHistory,
  type DemoTimePhase,
} from "./types";
import { defaultDemoShowForArtist, getDemoShow } from "./shows";

function pickEnum<T extends string>(value: string | null | undefined, allowed: readonly T[], fallback: T): T {
  if (value && (allowed as readonly string[]).includes(value)) return value as T;
  return fallback;
}

/** Parse scenario from URL search params. */
export function parseDemoScenarioFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): DemoScenario {
  const get = (key: string): string | undefined => {
    const raw = params instanceof URLSearchParams ? params.get(key) : params[key];
    if (Array.isArray(raw)) return raw[0];
    return raw ?? undefined;
  };

  const artist = pickEnum(get("artist"), DEMO_ARTISTS, DEFAULT_DEMO_SCENARIO.artist);
  const showKey =
    get("show") ?? defaultDemoShowForArtist(artist).key;

  return {
    artist,
    showKey: getDemoShow(showKey) ? showKey : defaultDemoShowForArtist(artist).key,
    timePhase: pickEnum(get("phase"), DEMO_TIME_PHASES, DEFAULT_DEMO_SCENARIO.timePhase),
    fanState: pickEnum(get("fan"), DEMO_FAN_STATES, DEFAULT_DEMO_SCENARIO.fanState),
    location: pickEnum(get("location"), DEMO_LOCATION_STATES, DEFAULT_DEMO_SCENARIO.location),
    fanHistory: pickEnum(get("history"), DEMO_FAN_HISTORY, DEFAULT_DEMO_SCENARIO.fanHistory),
    purchaseHistory: pickEnum(
      get("purchases"),
      DEMO_PURCHASE_HISTORY,
      DEFAULT_DEMO_SCENARIO.purchaseHistory,
    ),
    merchRule: pickEnum(get("merch"), DEMO_MERCH_RULES, DEFAULT_DEMO_SCENARIO.merchRule),
  };
}

/** Serialize scenario to URL search params (without leading ?). */
export function serializeDemoScenarioToSearchParams(scenario: DemoScenario): URLSearchParams {
  return new URLSearchParams({
    artist: scenario.artist,
    show: scenario.showKey,
    phase: scenario.timePhase,
    fan: scenario.fanState,
    location: scenario.location,
    history: scenario.fanHistory,
    purchases: scenario.purchaseHistory,
    merch: scenario.merchRule,
  });
}

export function demoScenarioWithArtist(artist: DemoArtistKey, current: DemoScenario): DemoScenario {
  const show = defaultDemoShowForArtist(artist);
  return { ...current, artist, showKey: show.key };
}

export const DEMO_FAN_STATE_LABELS: Record<DemoFanState, string> = {
  unknown: "Unknown",
  going: "I'm Going",
  at_venue: "At Venue",
  attended: "Attended",
  returning_fan: "Returning Fan",
};

export const DEMO_LOCATION_LABELS: Record<DemoLocationState, string> = {
  outside_venue: "Outside Venue",
  inside_venue: "Inside Venue Geofence",
};

export const DEMO_FAN_HISTORY_LABELS: Record<DemoFanHistory, string> = {
  first_show: "First Show",
  second_show: "Second Show",
  three_shows: "3 Shows",
  five_shows: "5 Shows",
  ten_shows: "10 Shows",
};

export const DEMO_PURCHASE_HISTORY_LABELS: Record<DemoPurchaseHistory, string> = {
  none: "None",
  core_merch: "Core Merch Purchased",
  show_exclusive: "Show Exclusive Purchased",
  multiple: "Multiple Purchases",
};

export const DEMO_MERCH_RULE_LABELS: Record<DemoMerchRule, string> = {
  auto: "Auto",
  teaser: "Teaser",
  visible_locked: "Visible + Locked",
  unlocked: "Unlocked",
  live_drop: "Live Drop",
  last_chance: "Last Chance",
  closed: "Closed",
};

export const DEMO_ARTIST_LABELS: Record<DemoArtistKey, string> = {
  the_degens: "The Degens",
  nova_kestrel: "Nova Kestrel",
  the_low_country: "The Low Country",
  marisol_reyes: "Marisol Reyes",
};

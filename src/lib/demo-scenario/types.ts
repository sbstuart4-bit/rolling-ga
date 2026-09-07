/** Demo scenario control values — used on /demo and encoded in URL/cookie. */

export const DEMO_ARTISTS = [
  "nova_kestrel",
  "the_degens",
  "the_low_country",
  "marisol_reyes",
] as const;

export type DemoArtistKey = (typeof DEMO_ARTISTS)[number];

export const DEMO_TIME_PHASES = [
  "t_minus_30",
  "t_minus_14",
  "t_minus_7",
  "t_minus_1",
  "show_day_morning",
  "t_minus_3_hours",
  "doors_open",
  "pre_show",
  "between_acts",
  "headliner",
  "encore",
  "show_ended",
  "t_plus_1",
  "t_plus_2",
  "t_plus_7",
  "t_plus_30",
] as const;

export type DemoTimePhase = (typeof DEMO_TIME_PHASES)[number];

export const DEMO_FAN_STATES = [
  "unknown",
  "going",
  "at_venue",
  "attended",
  "returning_fan",
] as const;

export type DemoFanState = (typeof DEMO_FAN_STATES)[number];

export const DEMO_LOCATION_STATES = ["outside_venue", "inside_venue"] as const;

export type DemoLocationState = (typeof DEMO_LOCATION_STATES)[number];

export const DEMO_FAN_HISTORY = [
  "first_show",
  "second_show",
  "three_shows",
  "five_shows",
  "ten_shows",
] as const;

export type DemoFanHistory = (typeof DEMO_FAN_HISTORY)[number];

export const DEMO_PURCHASE_HISTORY = [
  "none",
  "core_merch",
  "show_exclusive",
  "multiple",
] as const;

export type DemoPurchaseHistory = (typeof DEMO_PURCHASE_HISTORY)[number];

export const DEMO_MERCH_RULES = [
  "auto",
  "teaser",
  "visible_locked",
  "unlocked",
  "live_drop",
  "last_chance",
  "closed",
] as const;

export type DemoMerchRule = (typeof DEMO_MERCH_RULES)[number];

export interface DemoScenario {
  artist: DemoArtistKey;
  showKey: string;
  timePhase: DemoTimePhase;
  fanState: DemoFanState;
  location: DemoLocationState;
  fanHistory: DemoFanHistory;
  purchaseHistory: DemoPurchaseHistory;
  merchRule: DemoMerchRule;
}

export const DEFAULT_DEMO_SCENARIO: DemoScenario = {
  artist: "marisol_reyes",
  showKey: "marisol-brooklyn",
  timePhase: "t_minus_14",
  fanState: "unknown",
  location: "outside_venue",
  fanHistory: "first_show",
  purchaseHistory: "none",
  merchRule: "auto",
};

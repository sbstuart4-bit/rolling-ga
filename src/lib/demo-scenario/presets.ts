import type { DemoScenario } from "./types";

export interface DemoScenarioPreset {
  id: string;
  label: string;
  buttonLabel: string;
  description: string;
  scenario: DemoScenario;
}

export const DEMO_SCENARIO_PRESETS: DemoScenarioPreset[] = [
  {
    id: "degens_show_night",
    label: "The Degens — Show-Night Unlock",
    buttonLabel: "Run Degens Show Night",
    description:
      "Detroit · Doors Open · At Venue · First Show — geofence unlock, Detroit exclusives, encore drop.",
    scenario: {
      artist: "the_degens",
      showKey: "atlas-detroit",
      timePhase: "doors_open",
      fanState: "at_venue",
      location: "inside_venue",
      fanHistory: "first_show",
      purchaseHistory: "none",
      merchRule: "auto",
    },
  },
  {
    id: "nova_pre_show",
    label: "Nova Kestrel — Pre-Show Acquisition",
    buttonLabel: "Run Nova Pre-Show",
    description:
      "Nashville · T-14 · Unknown · Outside — social/ad landing, merch preview, I'm Going, countdown.",
    scenario: {
      artist: "nova_kestrel",
      showKey: "nova-nashville",
      timePhase: "t_minus_14",
      fanState: "unknown",
      location: "outside_venue",
      fanHistory: "first_show",
      purchaseHistory: "none",
      merchRule: "auto",
    },
  },
  {
    id: "low_country_returning",
    label: "The Low Country — Returning Fan",
    buttonLabel: "Run Low Country Returning Fan",
    description:
      "Austin · T-1 · Returning Fan · Second Show — welcome back, Austin merch, returning-fan collectible.",
    scenario: {
      artist: "the_low_country",
      showKey: "low-austin-return",
      timePhase: "t_minus_1",
      fanState: "returning_fan",
      location: "outside_venue",
      fanHistory: "second_show",
      purchaseHistory: "none",
      merchRule: "auto",
    },
  },
  {
    id: "marisol_violeta",
    label: "Marisol Reyes — Premium Show Exclusive",
    buttonLabel: "Run Marisol Violeta Night",
    description:
      "Brooklyn · Show Day T-3 Hours · I'm Going · Outside — Violeta preview, locked merch, arrival unlock.",
    scenario: {
      artist: "marisol_reyes",
      showKey: "marisol-brooklyn",
      timePhase: "t_minus_3_hours",
      fanState: "going",
      location: "outside_venue",
      fanHistory: "first_show",
      purchaseHistory: "none",
      merchRule: "auto",
    },
  },
];

export function getDemoScenarioPreset(id: string): DemoScenarioPreset | undefined {
  return DEMO_SCENARIO_PRESETS.find((preset) => preset.id === id);
}

import { createHash } from "node:crypto";

/**
 * Stable demo user UUIDs — identical across database resets so guided-demo URLs keep working.
 * Matches the derivation in `src/db/seed/index.ts`.
 */
export function demoUserId(key: string): string {
  const hash = createHash("sha1").update(`rolling-ga/demo-user/${key}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

export const DEMO_SCOTT_FAN_ID = demoUserId("fan_scott");
export const DEMO_ELENA_MARISOL_ID = demoUserId("team_marisol");
export const DEMO_MARCUS_DEGENS_ID = demoUserId("team_degens");

export const THE_DEGENS_ARTIST_ID = "art_the_degens";
export const MARISOL_ARTIST_ID = "art_marisol_reyes";
export const MARISOL_BROOKLYN_EVENT_ID = "evt_marisol_brooklyn";
export const BROOKLYN_ENCORE_ACTIVATION_DROP_ID = "drp_brooklyn_encore_activation";
export const BROOKLYN_CONNECTED_COHORT_AUDIENCE_ID = "aud_brooklyn_connected_cohort";

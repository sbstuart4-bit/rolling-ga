import type { GuidedJourneyId } from "./types";

const GUIDED_JOURNEY_ID_SET = new Set<string>([
  "marisol-tender-night",
  "nova-nashville",
  "degens-detroit",
]);

/** Maps legacy Nova marketing URLs to the active Marisol guided journey. */
export function normalizeGuidedJourneyId(id: string): GuidedJourneyId | undefined {
  if (id === "nova-nashville") return "marisol-tender-night";
  if (!GUIDED_JOURNEY_ID_SET.has(id)) return undefined;
  return id as GuidedJourneyId;
}

import { DEGENS_DETROIT_JOURNEY } from "./journeys/degens-detroit";
import { MARISOL_TENDER_NIGHT_JOURNEY } from "./journeys/marisol-tender-night";
import { normalizeGuidedJourneyId } from "./normalize-journey-id";

import type { GuidedDemoJourney, GuidedDemoStep, GuidedJourneyId } from "./types";

export * from "./types";
export { normalizeGuidedJourneyId } from "./normalize-journey-id";

export { NOVA_NASHVILLE_JOURNEY, NOVA_NASHVILLE_STEPS } from "./journeys/nova-nashville";
export {
  MARISOL_TENDER_NIGHT_JOURNEY,
  MARISOL_TENDER_NIGHT_STEPS,
} from "./journeys/marisol-tender-night";

/** Legacy journey data kept for reference tests only — not startable from the chooser. */
export { DEGENS_DETROIT_JOURNEY, DEGENS_DETROIT_STEPS } from "./journeys/degens-detroit";

const ACTIVE_JOURNEY = MARISOL_TENDER_NIGHT_JOURNEY;

export const COMING_SOON_GUIDED_JOURNEYS = [
  {
    id: "degens-detroit",
    title: "The Degens",
    subtitle: "Detroit full journey",
    comingSoon: true as const,
  },
  {
    id: "low-country-returning",
    title: "The Low Country",
    subtitle: "Returning fan",
    comingSoon: true as const,
  },
  {
    id: "nova-nashville",
    title: "Nova Kestrel",
    subtitle: "Gold Hour · Nashville",
    comingSoon: true as const,
  },
] as const;

export function getGuidedJourney(id: string): GuidedDemoJourney | undefined {
  const normalized = normalizeGuidedJourneyId(id);
  if (!normalized || normalized === "degens-detroit") return undefined;
  if (normalized === ACTIVE_JOURNEY.id) return ACTIVE_JOURNEY;
  return undefined;
}

export function getGuidedStep(journeyId: GuidedJourneyId, step: number): GuidedDemoStep | undefined {
  const journey = getGuidedJourney(journeyId);
  if (!journey) return undefined;
  return journey.steps.find((s) => s.step === step);
}

export function listActiveGuidedJourneys(): GuidedDemoJourney[] {
  return [ACTIVE_JOURNEY];
}

export function activeGuidedJourneyId(): GuidedJourneyId {
  return ACTIVE_JOURNEY.id;
}

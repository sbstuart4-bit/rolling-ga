import { DEGENS_DETROIT_JOURNEY } from "./journeys/degens-detroit";
import type { GuidedDemoJourney, GuidedDemoStep, GuidedJourneyId } from "./types";

export * from "./types";
export { DEGENS_DETROIT_JOURNEY, DEGENS_DETROIT_STEPS } from "./journeys/degens-detroit";

const JOURNEYS: GuidedDemoJourney[] = [DEGENS_DETROIT_JOURNEY];

export const COMING_SOON_GUIDED_JOURNEYS = [
  {
    id: "nova-pre-show",
    title: "Nova Kestrel",
    subtitle: "Pre-show acquisition",
    comingSoon: true as const,
  },
  {
    id: "low-country-returning",
    title: "The Low Country",
    subtitle: "Returning fan",
    comingSoon: true as const,
  },
  {
    id: "marisol-premium",
    title: "Marisol Reyes",
    subtitle: "Premium show exclusives",
    comingSoon: true as const,
  },
] as const;

export function getGuidedJourney(id: string): GuidedDemoJourney | undefined {
  return JOURNEYS.find((j) => j.id === id);
}

export function getGuidedStep(journeyId: GuidedJourneyId, step: number): GuidedDemoStep | undefined {
  const journey = getGuidedJourney(journeyId);
  if (!journey) return undefined;
  return journey.steps.find((s) => s.step === step);
}

export function listActiveGuidedJourneys(): GuidedDemoJourney[] {
  return JOURNEYS.filter((j) => !j.comingSoon);
}

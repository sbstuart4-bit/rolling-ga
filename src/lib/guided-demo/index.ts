import { NOVA_NASHVILLE_JOURNEY } from "./journeys/nova-nashville";

import type { GuidedDemoJourney, GuidedDemoStep, GuidedJourneyId } from "./types";



export * from "./types";

export { NOVA_NASHVILLE_JOURNEY, NOVA_NASHVILLE_STEPS } from "./journeys/nova-nashville";



/** Legacy journey data kept for reference tests only — not startable from the chooser. */

export { DEGENS_DETROIT_JOURNEY, DEGENS_DETROIT_STEPS } from "./journeys/degens-detroit";



const ACTIVE_JOURNEY = NOVA_NASHVILLE_JOURNEY;



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

    id: "marisol-premium",

    title: "Marisol Reyes",

    subtitle: "Premium show exclusives",

    comingSoon: true as const,

  },

] as const;



export function getGuidedJourney(id: string): GuidedDemoJourney | undefined {

  if (id === ACTIVE_JOURNEY.id) return ACTIVE_JOURNEY;

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


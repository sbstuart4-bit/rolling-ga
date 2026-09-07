import {
  MARISOL_ARTIST_STUDIO_JOURNEY,
  MARISOL_ARTIST_STUDIO_STEPS,
} from "./journeys/marisol-artist-studio";
import { normalizeArtistGuidedJourneyId } from "./normalize-journey-id";

import type {
  ArtistGuidedDemoJourney,
  ArtistGuidedDemoStep,
  ArtistGuidedJourneyId,
} from "./types";

export * from "./types";
export {
  MARISOL_ARTIST_STUDIO_JOURNEY,
  MARISOL_ARTIST_STUDIO_STEPS,
  MARISOL_ARTIST_STUDIO_ROUTE_PARAMS,
} from "./journeys/marisol-artist-studio";
export { normalizeArtistGuidedJourneyId, isArtistGuidedJourney } from "./normalize-journey-id";

const ACTIVE_JOURNEY = MARISOL_ARTIST_STUDIO_JOURNEY;

export function getArtistGuidedJourney(id: string): ArtistGuidedDemoJourney | undefined {
  const normalized = normalizeArtistGuidedJourneyId(id);
  if (!normalized) return undefined;
  if (normalized === ACTIVE_JOURNEY.id) return ACTIVE_JOURNEY;
  return undefined;
}

export function getArtistGuidedStep(
  journeyId: ArtistGuidedJourneyId,
  step: number,
): ArtistGuidedDemoStep | undefined {
  const journey = getArtistGuidedJourney(journeyId);
  if (!journey) return undefined;
  return journey.steps.find((s) => s.step === step);
}

export function listActiveArtistGuidedJourneys(): ArtistGuidedDemoJourney[] {
  return [ACTIVE_JOURNEY];
}

export function activeArtistGuidedJourneyId(): ArtistGuidedJourneyId {
  return ACTIVE_JOURNEY.id;
}

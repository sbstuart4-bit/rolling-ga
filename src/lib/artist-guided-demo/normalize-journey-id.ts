import type { ArtistGuidedJourneyId } from "./types";

const ARTIST_GUIDED_JOURNEY_ID_SET = new Set<string>(["marisol-artist-studio"]);

export function normalizeArtistGuidedJourneyId(id: string): ArtistGuidedJourneyId | undefined {
  if (!ARTIST_GUIDED_JOURNEY_ID_SET.has(id)) return undefined;
  return id as ArtistGuidedJourneyId;
}

export function isArtistGuidedJourney(id: string): boolean {
  return ARTIST_GUIDED_JOURNEY_ID_SET.has(id);
}

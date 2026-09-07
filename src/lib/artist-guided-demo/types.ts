import type { DemoTimePhase } from "@/lib/demo-scenario/types";

export const ARTIST_GUIDED_JOURNEY_IDS = ["marisol-artist-studio"] as const;

export type ArtistGuidedJourneyId = (typeof ARTIST_GUIDED_JOURNEY_IDS)[number];

export interface ArtistGuidedDemoPresenterHints {
  say: string;
  pointOut: string;
  next: string;
}

export interface ArtistGuidedDemoStep {
  step: number;
  title: string;
  whatArtistSees: string;
  whatChanged: string;
  whyItMatters: string;
  keyMessage?: string;
  presenterNote?: string;
  presenter?: ArtistGuidedDemoPresenterHints;
  /** Demo clock phase — positions Brooklyn post-show for insights and cohort views. */
  timePhase: DemoTimePhase;
  /** Relative studio route — `{eventId}` and `{fanId}` placeholders are resolved at runtime. */
  route: string;
  /** Label for the primary forward navigation control. */
  nextCta?: string;
  /** Final step — panel offers explore / pilot actions instead of Next. */
  isConclusion?: boolean;
}

export interface ArtistGuidedDemoJourney {
  id: ArtistGuidedJourneyId;
  title: string;
  subtitle: string;
  description: string;
  durationLabel: string;
  showKey: string;
  artistId: string;
  steps: ArtistGuidedDemoStep[];
}

export interface ArtistGuidedDemoSession {
  journeyId: ArtistGuidedJourneyId;
  step: number;
  autoplay: boolean;
  presenter: boolean;
}

export function resolveArtistGuidedRoute(
  route: string,
  params: { eventId: string; fanId: string },
): string {
  return route.replace("{eventId}", params.eventId).replace("{fanId}", params.fanId);
}

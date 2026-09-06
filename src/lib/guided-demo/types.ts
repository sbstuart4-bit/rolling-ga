import type { DemoScenario } from "@/lib/demo-scenario/types";
import type { DemoShowDefinition } from "@/lib/demo-scenario/shows";

export const GUIDED_JOURNEY_IDS = ["degens-detroit"] as const;

export type GuidedJourneyId = (typeof GUIDED_JOURNEY_IDS)[number];

export interface GuidedDemoPresenterHints {
  say: string;
  pointOut: string;
  next: string;
}

export interface GuidedDemoStep {
  step: number;
  title: string;
  whatFanSees: string;
  whatChanged: string;
  whyItMatters: string;
  presenterNote?: string;
  presenter?: GuidedDemoPresenterHints;
  scenario: DemoScenario;
  /** Relative fan route — resolved with the journey show slug. */
  route: string;
  /** When true, writes a real attendance credential via the existing verifier (demo-safe). */
  verifyAttendance?: boolean;
}

export interface GuidedDemoJourney {
  id: GuidedJourneyId;
  title: string;
  subtitle: string;
  description: string;
  durationLabel: string;
  showKey: string;
  steps: GuidedDemoStep[];
  comingSoon?: boolean;
}

export interface GuidedDemoSession {
  journeyId: GuidedJourneyId;
  step: number;
  autoplay: boolean;
  presenter: boolean;
}

export function resolveGuidedRoute(route: string, show: DemoShowDefinition): string {
  return route.replace("{slug}", show.slug);
}

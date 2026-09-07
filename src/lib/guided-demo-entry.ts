import type { NextRequest } from "next/server";
import { GUIDED_DEMO_COOKIE } from "@/lib/auth-cookies";
import {
  isArtistGuidedJourney,
  normalizeArtistGuidedJourneyId,
  type ArtistGuidedJourneyId,
} from "@/lib/artist-guided-demo";
import { normalizeGuidedJourneyId, type GuidedJourneyId } from "@/lib/guided-demo";

/** Set by edge proxy so layouts can bootstrap demo sessions without cookie writes in RSC. */
export const GUIDED_DEMO_ENTRY_HEADER = "x-rga-guided-entry";

const FAN_GUIDED_JOURNEY_IDS = new Set<GuidedJourneyId>([
  "marisol-tender-night",
  "nova-nashville",
  "degens-detroit",
]);

export type ParsedGuidedDemoQuery =
  | {
      perspective: "fan";
      journeyId: GuidedJourneyId;
      step: number;
      presenter: boolean;
      autoplay: boolean;
    }
  | {
      perspective: "artist";
      journeyId: ArtistGuidedJourneyId;
      step: number;
      presenter: boolean;
      autoplay: boolean;
    };

function parseStep(searchParams: URLSearchParams): number | null {
  const step = Number.parseInt(searchParams.get("step") ?? "", 10);
  if (!Number.isFinite(step) || step < 1) return null;
  return step;
}

export function isFanGuidedDemoQuery(searchParams: URLSearchParams): boolean {
  const guided = searchParams.get("guided");
  if (!guided || !normalizeGuidedJourneyId(guided)) return false;
  return parseStep(searchParams) != null;
}

export function isArtistGuidedDemoQuery(searchParams: URLSearchParams): boolean {
  const guided = searchParams.get("guided");
  if (!guided || !normalizeArtistGuidedJourneyId(guided)) return false;
  return parseStep(searchParams) != null;
}

/** @deprecated Use isFanGuidedDemoQuery */
export function isGuidedDemoQuery(searchParams: URLSearchParams): boolean {
  return isFanGuidedDemoQuery(searchParams);
}

export function requestHasGuidedDemoCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get(GUIDED_DEMO_COOKIE)?.value);
}

/** Anonymous guided-demo routes must reach the server to establish the demo session. */
export function shouldAllowGuidedDemoRequest(request: NextRequest): boolean {
  if (requestHasGuidedDemoCookie(request)) return true;

  const { searchParams, pathname } = request.nextUrl;

  if (isArtistGuidedDemoQuery(searchParams)) {
    return pathname.startsWith("/studio");
  }

  if (isFanGuidedDemoQuery(searchParams)) {
    return !pathname.startsWith("/studio");
  }

  return false;
}

/** @deprecated Use shouldAllowGuidedDemoRequest */
export function shouldAllowGuidedDemoFanRequest(request: NextRequest): boolean {
  return shouldAllowGuidedDemoRequest(request);
}

export function parseGuidedDemoQuery(searchParams: URLSearchParams): ParsedGuidedDemoQuery | null {
  const guided = searchParams.get("guided");
  if (!guided) return null;

  const step = parseStep(searchParams);
  if (step == null) return null;

  const artistJourneyId = normalizeArtistGuidedJourneyId(guided);
  if (artistJourneyId) {
    return {
      perspective: "artist",
      journeyId: artistJourneyId,
      step,
      presenter: searchParams.get("presenter") === "1",
      autoplay: searchParams.get("autoplay") === "1",
    };
  }

  const fanJourneyId = normalizeGuidedJourneyId(guided);
  if (!fanJourneyId || !FAN_GUIDED_JOURNEY_IDS.has(fanJourneyId)) return null;

  return {
    perspective: "fan",
    journeyId: fanJourneyId,
    step,
    presenter: searchParams.get("presenter") === "1",
    autoplay: searchParams.get("autoplay") === "1",
  };
}

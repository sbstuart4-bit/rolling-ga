import type { NextRequest } from "next/server";
import { GUIDED_DEMO_COOKIE } from "@/lib/auth-cookies";
import type { GuidedJourneyId } from "@/lib/guided-demo";

/** Request header set by edge proxy when a guided demo fan route is allowed through. */
export const GUIDED_DEMO_ENTRY_HEADER = "x-rga-guided-entry";

const GUIDED_JOURNEY_IDS = new Set<GuidedJourneyId>(["nova-nashville", "degens-detroit"]);

export function isGuidedDemoQuery(searchParams: URLSearchParams): boolean {
  const guided = searchParams.get("guided");
  if (!guided || !GUIDED_JOURNEY_IDS.has(guided as GuidedJourneyId)) return false;

  const step = Number.parseInt(searchParams.get("step") ?? "", 10);
  return Number.isFinite(step) && step >= 1;
}

export function requestHasGuidedDemoCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get(GUIDED_DEMO_COOKIE)?.value);
}

/** Anonymous guided-demo fan routes must reach the server to establish Scott's demo session. */
export function shouldAllowGuidedDemoFanRequest(request: NextRequest): boolean {
  if (requestHasGuidedDemoCookie(request)) return true;
  return isGuidedDemoQuery(request.nextUrl.searchParams);
}

export function parseGuidedDemoQuery(searchParams: URLSearchParams): {
  journeyId: GuidedJourneyId;
  step: number;
  presenter: boolean;
  autoplay: boolean;
} | null {
  const guided = searchParams.get("guided");
  if (!guided || !GUIDED_JOURNEY_IDS.has(guided as GuidedJourneyId)) return null;

  const step = Number.parseInt(searchParams.get("step") ?? "", 10);
  if (!Number.isFinite(step) || step < 1) return null;

  return {
    journeyId: guided as GuidedJourneyId,
    step,
    presenter: searchParams.get("presenter") === "1",
    autoplay: searchParams.get("autoplay") === "1",
  };
}

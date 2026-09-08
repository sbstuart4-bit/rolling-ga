import type { DeliveryPerformanceMetrics, FulfillmentPipelineCounts } from "@/lib/fulfillment";
import type { ShowOperationalHealth, ShowOperationalState } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** Shows with incomplete fulfillment remain relevant for this window after end. */
export const OPS_RECENTLY_ENDED_MS = 14 * DAY_MS;

/** Upcoming shows starting within this window appear on the command center. */
export const OPS_UPCOMING_WINDOW_MS = 7 * DAY_MS;

/**
 * Material at-risk volume: more than this share of in-flight orders triggers AT RISK state.
 * Centralized threshold — not cosmetic coloring.
 */
export const OPS_AT_RISK_SHARE_THRESHOLD = 0.08;

export function isShowLive(startsAt: Date, endsAt: Date, now: Date): boolean {
  const t = now.getTime();
  return t >= startsAt.getTime() && t <= endsAt.getTime();
}

export function hasIncompleteFulfillment(pipeline: FulfillmentPipelineCounts): boolean {
  return pipeline.received + pipeline.production + pipeline.packed + pipeline.shipped + pipeline.exception > 0;
}

export function deriveShowOperationalState(input: {
  startsAt: Date;
  endsAt: Date;
  now: Date;
  pipeline: FulfillmentPipelineCounts;
  performance: DeliveryPerformanceMetrics;
  orderCount: number;
}): ShowOperationalState {
  const { startsAt, endsAt, now, pipeline, performance, orderCount } = input;

  if (orderCount === 0) {
    if (now.getTime() < startsAt.getTime()) return "upcoming";
    if (isShowLive(startsAt, endsAt, now)) return "live";
    return "complete";
  }

  if (isShowLive(startsAt, endsAt, now)) return "live";

  const ended = now.getTime() > endsAt.getTime();
  const incomplete = hasIncompleteFulfillment(pipeline);

  if (!ended) {
    if (incomplete) return "fulfilling";
    return "upcoming";
  }

  if (!incomplete) return "complete";

  const inFlight =
    pipeline.received + pipeline.production + pipeline.packed + pipeline.shipped + pipeline.exception;
  const atRiskShare = inFlight > 0 ? performance.atRiskCount / inFlight : 0;
  const hasMaterialRisk =
    performance.pastPromiseCount > 0 ||
    performance.openExceptions > 0 ||
    atRiskShare >= OPS_AT_RISK_SHARE_THRESHOLD;

  return hasMaterialRisk ? "at_risk" : "fulfilling";
}

export function deriveShowOperationalHealth(
  performance: DeliveryPerformanceMetrics,
): ShowOperationalHealth {
  if (performance.pastPromiseCount > 0 || performance.openExceptions > 0) {
    return "action_needed";
  }
  if (performance.atRiskCount > 0) {
    return "watch";
  }
  return "on_track";
}

export function formatShowTimingLabel(input: {
  startsAt: Date;
  endsAt: Date;
  now: Date;
  operationalState: ShowOperationalState;
}): string {
  const { startsAt, endsAt, now, operationalState } = input;

  if (operationalState === "live") {
    const elapsedMs = now.getTime() - startsAt.getTime();
    const minutes = Math.max(0, Math.floor(elapsedMs / 60_000));
    if (minutes < 60) return `Live · ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `Live · ${hours}h ${rem}m` : `Live · ${hours}h`;
  }

  if (now.getTime() < startsAt.getTime()) {
    const delta = startsAt.getTime() - now.getTime();
    if (delta < DAY_MS) {
      const hours = Math.max(1, Math.round(delta / HOUR_MS));
      return `Starts in ${hours}h`;
    }
    const days = Math.max(1, Math.round(delta / DAY_MS));
    return `Starts in ${days}d`;
  }

  if (operationalState === "fulfilling" || operationalState === "at_risk") {
    const endedMs = now.getTime() - endsAt.getTime();
    if (endedMs < DAY_MS) {
      const hours = Math.max(1, Math.floor(endedMs / HOUR_MS));
      const minutes = Math.floor((endedMs % HOUR_MS) / 60_000);
      if (hours < 1) return `Show ended · ${minutes}m ago`;
      return minutes > 0 ? `Show ended · ${hours}h ${minutes}m ago` : `Show ended · ${hours}h ago`;
    }
    return "Fulfillment active";
  }

  if (operationalState === "complete") {
    const endedMs = now.getTime() - endsAt.getTime();
    if (endedMs < 3 * DAY_MS) return "Recently complete";
    return "Complete";
  }

  return "Upcoming";
}

export function isShowRelevant(input: {
  startsAt: Date;
  endsAt: Date;
  now: Date;
  orderCount: number;
  pipeline: FulfillmentPipelineCounts;
}): boolean {
  const { startsAt, endsAt, now, orderCount, pipeline } = input;

  if (orderCount === 0) return false;

  if (isShowLive(startsAt, endsAt, now)) return true;
  if (hasIncompleteFulfillment(pipeline)) return true;

  const endedRecently =
    now.getTime() > endsAt.getTime() && now.getTime() - endsAt.getTime() <= OPS_RECENTLY_ENDED_MS;
  if (endedRecently) return true;

  const startingSoon =
    now.getTime() < startsAt.getTime() && startsAt.getTime() - now.getTime() <= OPS_UPCOMING_WINDOW_MS;
  if (startingSoon) return true;

  return false;
}

import type { EventState } from "./types";

export const DEFAULT_POST_SHOW_WINDOW_MINUTES = 480;

export interface EventTiming {
  startsAt: Date;
  endsAt: Date;
  doorsAt?: Date | null;
  /** Event-level override; falls back to the tour's window. */
  postShowWindowMinutes?: number | null;
  cancelled?: boolean;
}

export interface EventStateResult {
  state: EventState;
  /** When the attendee-exclusive post-show store closes. Null once archived. */
  postShowClosesAt: Date | null;
  msUntilStart: number;
  msUntilPostShowClose: number | null;
}

export function postShowWindowMinutes(
  event: Pick<EventTiming, "postShowWindowMinutes">,
  tourWindowMinutes: number | null | undefined,
): number {
  return event.postShowWindowMinutes ?? tourWindowMinutes ?? DEFAULT_POST_SHOW_WINDOW_MINUTES;
}

/**
 * Event state is always derived from timestamps rather than stored, so a show can never
 * be left in the wrong state because a scheduled job did not run. The post-show window
 * is configurable per tour and per event.
 */
export function resolveEventState(
  event: EventTiming,
  tourWindowMinutes: number | null | undefined,
  now: Date = new Date(),
): EventStateResult {
  const windowMinutes = postShowWindowMinutes(event, tourWindowMinutes);
  const postShowClosesAt = new Date(event.endsAt.getTime() + windowMinutes * 60_000);
  const nowMs = now.getTime();

  const msUntilStart = event.startsAt.getTime() - nowMs;
  const msUntilPostShowClose = postShowClosesAt.getTime() - nowMs;

  let state: EventState;
  if (event.cancelled) {
    state = "archived";
  } else if (nowMs < event.startsAt.getTime()) {
    state = "upcoming";
  } else if (nowMs <= event.endsAt.getTime()) {
    state = "live";
  } else if (nowMs <= postShowClosesAt.getTime()) {
    state = "recently_ended";
  } else {
    state = "archived";
  }

  return {
    state,
    postShowClosesAt: state === "archived" ? null : postShowClosesAt,
    msUntilStart,
    msUntilPostShowClose: state === "recently_ended" ? msUntilPostShowClose : null,
  };
}

/**
 * Verification is open from doors (or an explicit override) until the post-show window
 * closes, so someone who forgets to scan during the set can still claim their credential
 * on the way out.
 */
export function verificationWindow(
  event: EventTiming & {
    verificationOpensAt?: Date | null;
    verificationClosesAt?: Date | null;
  },
  tourWindowMinutes: number | null | undefined,
): { opensAt: Date; closesAt: Date } {
  const windowMinutes = postShowWindowMinutes(event, tourWindowMinutes);
  const opensAt =
    event.verificationOpensAt ??
    event.doorsAt ??
    new Date(event.startsAt.getTime() - 3 * 60 * 60_000);
  const closesAt =
    event.verificationClosesAt ?? new Date(event.endsAt.getTime() + windowMinutes * 60_000);

  return { opensAt, closesAt };
}

export function isAnniversaryToday(eventStart: Date, now: Date = new Date()): boolean {
  return (
    eventStart.getMonth() === now.getMonth() &&
    eventStart.getDate() === now.getDate() &&
    eventStart.getFullYear() < now.getFullYear()
  );
}

export function yearsSince(eventStart: Date, now: Date = new Date()): number {
  return now.getFullYear() - eventStart.getFullYear();
}

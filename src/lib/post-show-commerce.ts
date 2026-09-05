import type { EventState } from "@/lib/types";
import type { EventStateResult } from "@/lib/event-state";

/** Whether the show is in the post-set phase (post-show window or archived memory). */
export function isPostShowPhase(state: EventState): boolean {
  return state === "recently_ended" || state === "archived";
}

/** Attendee-exclusive store is open during the live set and post-show commerce window. */
export function isAttendeeStoreOpen(state: EventState): boolean {
  return state === "live" || state === "recently_ended";
}

/** Hero pill copy when a verified fan returns after the set. */
export function verifiedPostShowStateLabel(state: EventState): string {
  if (state === "archived" || state === "recently_ended") return "You were there";
  return "Live now";
}

export interface EventCommerceOverride {
  dropEndsAt?: Date | null;
  productAvailableUntil?: Date | null;
}

/**
 * Whether event-scoped attendee commerce is still open.
 * After the post-show window closes, only separately scheduled drops/products remain purchasable.
 */
export function canPurchaseInEventAttendeeStore(
  timing: Pick<EventStateResult, "state">,
  overrides: EventCommerceOverride,
  now: Date,
): boolean {
  if (timing.state === "live" || timing.state === "recently_ended") return true;

  if (timing.state === "archived") {
    if (overrides.dropEndsAt && overrides.dropEndsAt > now) return true;
    if (overrides.productAvailableUntil && overrides.productAvailableUntil > now) return true;
    return false;
  }

  return true;
}

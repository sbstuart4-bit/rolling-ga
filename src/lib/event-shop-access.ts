import type { FanExperienceState } from "@/lib/fan-experience/access-state";
import {
  canPreviewShop,
  canPurchaseShowExclusives,
  hasEarnedCredential,
} from "@/lib/fan-experience/access-state";
import type { EventState } from "@/lib/types";
import { formatEventDateShort, relativeDayLabel } from "@/lib/format";

export function eventShopTitle(
  timingState: EventState,
  startsAt: Date,
  now: Date,
): string {
  if (timingState === "upcoming") {
    const relative = relativeDayLabel(startsAt, now);
    if (relative === "Today" || relative === "Tomorrow") return "What's coming tonight";
    return `What's coming · ${formatEventDateShort(startsAt)}`;
  }
  if (timingState === "recently_ended") return "Complete your collection";
  if (timingState === "archived") return "From this show";
  return "Tonight's Drop";
}

export function eventShopSubtitle(
  timingState: EventState,
  fanExperience: FanExperienceState,
  storeOpen: boolean,
): string {
  const { access, experience } = fanExperience;
  const hasCredential = hasEarnedCredential(fanExperience);

  if (!hasCredential) {
    if (timingState === "upcoming") {
      if (access === "discover_only") {
        return "Merch opens closer to show night. Something exclusive is on the way.";
      }
      if (experience?.showExclusiveVisibility === "hidden") {
        return "Show-exclusive pieces aren't visible yet. Check Drops for tour merch.";
      }
      return "Preview what's waiting. Show exclusives unlock when you're inside the venue.";
    }
    if (access === "live_unlocked") {
      return "You're inside the venue — tonight's show exclusives are unlocked.";
    }
    if (access === "preview_locked") {
      return "Preview what's waiting. Show exclusives unlock when you're inside the venue.";
    }
    return "Show exclusives unlock when you're inside the venue.";
  }

  if (storeOpen && canPurchaseShowExclusives(access)) {
    return "Attendee-exclusive pieces and post-show drops are unlocked for you.";
  }
  return "The attendee store has closed. Your credential and past purchases remain in My Shows.";
}

export { canPreviewShop, canPurchaseShowExclusives };

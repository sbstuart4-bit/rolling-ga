/** Client-safe helpers for event commerce gating copy. */

import type { FanExperienceState } from "@/lib/fan-experience/access-state";
import { hasEarnedCredential } from "@/lib/fan-experience/access-state";

export function attendeeShopUnlockLabel(fanExperience: FanExperienceState): string {
  if (hasEarnedCredential(fanExperience)) {
    return "Attendee-exclusive pieces and post-show drops are unlocked for you.";
  }
  if (fanExperience.access === "live_unlocked") {
    return "You're inside the venue — tonight's show exclusives are unlocked.";
  }
  return "Verify at the venue to unlock pieces made for this room.";
}

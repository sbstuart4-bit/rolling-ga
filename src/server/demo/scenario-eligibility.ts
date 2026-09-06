import "server-only";

import type { ProductRow } from "@/server/catalog/queries";
import { isEligibleForProduct } from "@/server/catalog/queries";
import { demoModeEnabled } from "@/lib/demo-mode";
import type { DemoScenario } from "@/lib/demo-scenario/types";
import { getDemoShowByEventId } from "@/lib/demo-scenario/shows";
import {
  canPurchaseShowExclusives,
  canPreviewShop,
  resolveFanExperienceState,
  timingStateForDemoPhase,
} from "@/lib/fan-experience/access-state";
import { isAttendeeStoreOpen } from "@/lib/post-show-commerce";
import { getActiveDemoScenarioContext } from "./scenario-state";
import { applyScenarioToAttendance, type AttendanceContext } from "./scenario-attendance";
import { demoNow } from "./clock";

function isShowExclusiveProduct(
  product: Pick<ProductRow, "accessType" | "eventId">,
  eventId: string,
): boolean {
  return (
    product.accessType === "event_specific" ||
    (product.accessType === "verified_attendee" && product.eventId === eventId) ||
    Boolean(product.eventId && product.eventId === eventId)
  );
}

/**
 * Demo-aware product eligibility — layers canonical fan experience on real access checks.
 * Production behavior is unchanged when demo mode is off or no scenario is active.
 */
export async function getDemoAwareProductEligibility(
  product: Pick<ProductRow, "accessType" | "eventId" | "tourId" | "availableFrom" | "availableUntil">,
  realAttendance: AttendanceContext,
  eventId?: string | null,
  now = demoNow(),
): Promise<{ eligible: boolean; reason?: string; demoScenarioActive?: boolean }> {
  const base = await isEligibleForProduct(product, realAttendance, now);

  if (!demoModeEnabled()) return base;

  const ctx = await getActiveDemoScenarioContext();
  if (!ctx) return base;

  const attendance = applyScenarioToAttendance(ctx.scenario, realAttendance);
  const scenarioEligible = await isEligibleForProduct(product, attendance, now);

  const show = eventId ? getDemoShowByEventId(eventId) : ctx.show;
  if (!show || show.eventId !== ctx.show.eventId) {
    return scenarioEligible;
  }

  const timingState = timingStateForDemoPhase(ctx.scenario.timePhase);
  const fanExperience = resolveFanExperienceState({
    eventId: show.eventId,
    scenario: ctx.scenario,
    realVerified: attendance.attendedEventIds.includes(show.eventId),
    timingState,
    storeOpen: isAttendeeStoreOpen(timingState),
    now,
  });

  const exclusive = isShowExclusiveProduct(product, show.eventId);
  const experience = fanExperience.experience;

  if (exclusive) {
    if (fanExperience.access === "discover_only") {
      return {
        eligible: false,
        reason: experience?.primaryMessage ?? "Coming soon",
        demoScenarioActive: true,
      };
    }
    if (!canPurchaseShowExclusives(fanExperience.access)) {
      return {
        eligible: false,
        reason: experience?.primaryMessage || "Unlocks at the show",
        demoScenarioActive: true,
      };
    }
    return { eligible: true, demoScenarioActive: true };
  }

  if (!canPreviewShop(fanExperience.access) || !experience?.coreMerchPurchasable) {
    return { eligible: false, reason: experience?.primaryMessage, demoScenarioActive: true };
  }

  return { ...scenarioEligible, demoScenarioActive: true };
}

export async function getDemoScenarioForEvent(
  eventId: string,
): Promise<Awaited<ReturnType<typeof getActiveDemoScenarioContext>>> {
  if (!demoModeEnabled()) return null;
  const ctx = await getActiveDemoScenarioContext();
  if (!ctx || ctx.show.eventId !== eventId) return null;
  return ctx;
}

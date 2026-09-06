import "server-only";

import { getActiveDemoScenarioContext } from "./scenario-state";
import { resolvePurchaseState } from "@/lib/fan-experience/access-state";

/** Hide seeded/demo orders when the guided scenario has not recorded a purchase yet. */
export async function shouldSuppressGuidedDemoEventOrders(
  eventId: string,
): Promise<boolean> {
  const ctx = await getActiveDemoScenarioContext();
  if (!ctx || ctx.show.eventId !== eventId) return false;
  return resolvePurchaseState(ctx.scenario, eventId) === "none";
}

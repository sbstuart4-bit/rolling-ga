import type { ProductAccessType } from "@/lib/types";
import { merchExperienceLockLabel } from "./resolver";
import type { MerchExperienceState } from "./types";

export interface DropProductPresentationInput {
  accessType: ProductAccessType | string;
  eventId: string | null;
  dropEventId: string | null;
}

export interface DropProductPresentation {
  canBuy: boolean;
  actionLabel: string;
  teaser: boolean;
  locked: boolean;
  lockLabel?: string;
}

export function isDropVisibleInDemoScenario(
  drop: Pick<DropProductPresentationInput, "eventId"> & { eventId: string | null },
  scenarioShowEventId: string,
): boolean {
  return drop.eventId === null || drop.eventId === scenarioShowEventId;
}

export function shouldShowDropCountdown(
  drop: {
    endsAt: Date | null;
    exclusivityType: string;
    eventId: string | null;
  },
  scenarioShowEventId: string,
  now: Date,
): boolean {
  if (!drop.endsAt || drop.endsAt <= now) return false;
  if (drop.exclusivityType !== "flash" && drop.exclusivityType !== "post_show") return false;
  return drop.eventId === null || drop.eventId === scenarioShowEventId;
}

export function isShowExclusiveProduct(
  product: Pick<DropProductPresentationInput, "accessType" | "eventId">,
  contextEventId: string | null | undefined,
): boolean {
  if (!contextEventId) return false;
  return (
    product.accessType === "event_specific" ||
    product.accessType === "verified_attendee" ||
    Boolean(product.eventId && product.eventId === contextEventId)
  );
}

/**
 * Fan-facing CTA for a product row on /drops — respects demo merch-experience phases.
 */
export function resolveDropProductPresentation(
  product: DropProductPresentationInput,
  experience: MerchExperienceState,
  scenarioShowEventId: string,
): DropProductPresentation {
  const contextEventId = product.eventId ?? product.dropEventId ?? scenarioShowEventId;
  const exclusive = isShowExclusiveProduct(product, contextEventId);
  const appliesToScenarioShow =
    !contextEventId || contextEventId === scenarioShowEventId;

  if (!exclusive) {
    return {
      canBuy: experience.coreMerchPurchasable,
      actionLabel: experience.coreMerchPurchasable ? "Buy now" : "Unavailable",
      teaser: false,
      locked: !experience.coreMerchPurchasable,
    };
  }

  if (!appliesToScenarioShow) {
    if (experience.showExclusiveVisibility === "teaser") {
      return {
        canBuy: false,
        actionLabel: "Coming soon",
        teaser: true,
        locked: true,
        lockLabel: "Coming soon",
      };
    }
    return {
      canBuy: false,
      actionLabel: "Unlocks at the show",
      teaser: false,
      locked: true,
      lockLabel: "Unlocks at the show",
    };
  }

  if (experience.showExclusiveVisibility === "teaser") {
    return {
      canBuy: false,
      actionLabel: "Coming soon",
      teaser: true,
      locked: true,
      lockLabel: experience.primaryMessage || "Coming soon",
    };
  }

  if (!experience.showExclusivePurchasable) {
    const lockLabel = merchExperienceLockLabel(experience);
    return {
      canBuy: false,
      actionLabel: lockLabel,
      teaser: false,
      locked: true,
      lockLabel,
    };
  }

  return {
    canBuy: true,
    actionLabel: "Buy now",
    teaser: false,
    locked: false,
  };
}

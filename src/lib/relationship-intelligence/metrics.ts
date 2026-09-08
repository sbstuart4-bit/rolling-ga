import {
  attributeOrderToEvent,
  postShowGmvWithinWindow,
  sumAttributedGmv,
  type EventWindow,
  type OrderAttributionInput,
} from "@/lib/fan-attribution";
import type {
  CohortFunnelCounts,
  CohortTimelinePhase,
  FanCohortMembership,
  PostShowWindowMetrics,
} from "./types";

/**
 * Metric definitions (show cohort scope):
 *
 * ATTENDEE — verified attendance at this event.
 * CONNECTED FAN — attendee with granted attendee_offers consent for the artist.
 * PURCHASING FAN — connected fan with ≥1 qualifying paid purchase attributed to this show.
 * POST-SHOW PURCHASER — connected fan with ≥1 post-show-window purchase attributed to this show.
 * REPEAT PURCHASER — connected fan with ≥2 distinct attributed orders for this show.
 *
 * Qualifying purchase: paid order line attributed via event_scoped commerce or drop event link
 * (see fan-attribution.ts). Show-night vs post-show uses event start/end windows.
 */

export function classifyFanCohortMembership(opts: {
  isVerifiedAttendee: boolean;
  isConnected: boolean;
  userOrders: OrderAttributionInput[];
  eventWindow: EventWindow;
}): FanCohortMembership {
  const { isVerifiedAttendee, isConnected, userOrders, eventWindow } = opts;
  const verifiedSet = new Set([eventWindow.eventId]);

  let showNightGmv = 0;
  let postShowGmv = 0;
  let attributedOrderCount = 0;
  let lastActivityAt: Date | null = null;

  const attributedOrderIds = new Set<string>();

  if (isVerifiedAttendee) {
    for (const order of userOrders) {
      const attributed = attributeOrderToEvent(order, eventWindow, verifiedSet);
      const hasAttribution = attributed.some((a) => a.attributedEventId === eventWindow.eventId);
      if (hasAttribution) {
        attributedOrderIds.add(order.orderId);
      }
      showNightGmv += sumAttributedGmv(attributed, "show_night");
      postShowGmv += sumAttributedGmv(attributed, "post_show");

      if (order.placedAt) {
        const t = order.placedAt.getTime();
        if (!lastActivityAt || t > lastActivityAt.getTime()) {
          lastActivityAt = order.placedAt;
        }
      }
    }
    attributedOrderCount = attributedOrderIds.size;
  }

  const isPurchasing = isConnected && attributedOrderCount >= 1;
  const isPostShowPurchaser = isConnected && postShowGmv > 0;
  const isRepeatPurchaser = isConnected && attributedOrderCount >= 2;

  return {
    userId: "",
    isAttendee: isVerifiedAttendee,
    isConnected,
    isPurchasing,
    isPostShowPurchaser,
    isRepeatPurchaser,
    showNightGmvCents: showNightGmv,
    postShowGmvCents: postShowGmv,
    totalObservedGmvCents: showNightGmv + postShowGmv,
    attributedOrderCount,
    lastActivityAt,
  };
}

export function aggregateFunnelCounts(memberships: FanCohortMembership[]): CohortFunnelCounts {
  return {
    attendees: memberships.filter((m) => m.isAttendee).length,
    connectedFans: memberships.filter((m) => m.isConnected).length,
    purchasingFans: memberships.filter((m) => m.isPurchasing).length,
    postShowPurchasers: memberships.filter((m) => m.isPostShowPurchaser).length,
    repeatPurchasers: memberships.filter((m) => m.isRepeatPurchaser).length,
  };
}

export function buildPostShowWindows(
  memberships: FanCohortMembership[],
  userOrders: Map<string, OrderAttributionInput[]>,
  eventWindow: EventWindow,
  eventEndsAt: Date,
): PostShowWindowMetrics[] {
  const windows = [
    { label: "T+1 day", days: 1 },
    { label: "T+7 days", days: 7 },
    { label: "T+30 days", days: 30 },
  ];

  return windows.map(({ label, days }) => {
    let postShowGmv = 0;
    let postShowOrders = 0;
    const purchaserIds = new Set<string>();
    const activeIds = new Set<string>();
    let repeatPurchasers = 0;

    const verifiedSet = new Set([eventWindow.eventId]);

    for (const membership of memberships) {
      if (!membership.isConnected) continue;

      const orders = userOrders.get(membership.userId) ?? [];
      let fanGmv = 0;
      let fanOrders = 0;

      for (const order of orders) {
        const attributed = attributeOrderToEvent(order, eventWindow, verifiedSet);
        const windowGmv = postShowGmvWithinWindow(attributed, eventEndsAt, days);
        if (windowGmv > 0) {
          fanGmv += windowGmv;
          fanOrders += 1;
          if (order.placedAt) activeIds.add(membership.userId);
        }
      }

      if (fanGmv > 0) {
        postShowGmv += fanGmv;
        postShowOrders += fanOrders;
        purchaserIds.add(membership.userId);
      }
      if (fanOrders >= 2) repeatPurchasers += 1;
    }

    return {
      label,
      daysAfterShow: days,
      activeFans: activeIds.size,
      postShowPurchasers: purchaserIds.size,
      postShowOrders,
      postShowGmvCents: postShowGmv,
      repeatPurchasers,
    };
  });
}

export function buildCohortTimeline(
  funnel: CohortFunnelCounts,
  showNightGmvCents: number,
  windows: PostShowWindowMetrics[],
): CohortTimelinePhase[] {
  const t1 = windows.find((w) => w.daysAfterShow === 1)!;
  const t7 = windows.find((w) => w.daysAfterShow === 7)!;
  const t30 = windows.find((w) => w.daysAfterShow === 30)!;

  return [
    {
      key: "show_night",
      label: "Show night",
      description: "During the set window",
      connectedFans: funnel.connectedFans,
      purchasers: funnel.purchasingFans,
      gmvCents: showNightGmvCents,
      repeatPurchasers: 0,
    },
    {
      key: "t_plus_1",
      label: "T+1",
      description: "First day after the show",
      connectedFans: funnel.connectedFans,
      purchasers: t1.postShowPurchasers,
      gmvCents: t1.postShowGmvCents,
      repeatPurchasers: t1.repeatPurchasers,
    },
    {
      key: "t_plus_7",
      label: "T+7",
      description: "First week post-show",
      connectedFans: funnel.connectedFans,
      purchasers: t7.postShowPurchasers,
      gmvCents: t7.postShowGmvCents,
      repeatPurchasers: t7.repeatPurchasers,
    },
    {
      key: "t_plus_30",
      label: "T+30",
      description: "First month post-show",
      connectedFans: funnel.connectedFans,
      purchasers: t30.postShowPurchasers,
      gmvCents: t30.postShowGmvCents,
      repeatPurchasers: t30.repeatPurchasers,
    },
  ];
}

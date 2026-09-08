/**
 * Activated revenue — GMV from qualifying paid orders attributable to a Rolling GA
 * audience activation (show_cohort drop).
 *
 * Activated revenue is a subset of post-show GMV, never double-counted in totals.
 */

export interface ActivationOrderLine {
  dropId: string | null;
  lineTotalCents: number;
  placedAt: Date | null;
  userId: string;
  orderId: string;
}

export interface PostShowGmvBreakdown {
  /** All post-show attributed GMV for the cohort event. */
  postShowGmvCents: number;
  /** Post-show GMV from orders through show_cohort activation drops. */
  activatedPostShowGmvCents: number;
  /** Post-show GMV not tied to an audience activation drop. */
  organicPostShowGmvCents: number;
}

export interface ActivationResultsMetrics {
  dropId: string;
  eligibleFans: number;
  purchasingFans: number;
  orderCount: number;
  conversionRate: number | null;
  activatedRevenueCents: number;
  averageOrderValueCents: number | null;
  repeatPurchasers: number;
}

/**
 * A line counts toward activated revenue when it is a paid order line with a dropId
 * that belongs to an activation drop (show_cohort audience segment).
 */
export function isActivatedRevenueLine(
  line: Pick<ActivationOrderLine, "dropId">,
  activationDropIds: ReadonlySet<string>,
): boolean {
  return line.dropId != null && activationDropIds.has(line.dropId);
}

export function computeActivationResults(
  eligibleFans: number,
  lines: ActivationOrderLine[],
): ActivationResultsMetrics {
  const purchaserIds = new Set<string>();
  const orderIds = new Set<string>();
  let revenue = 0;
  const ordersByUser = new Map<string, Set<string>>();

  for (const line of lines) {
    revenue += line.lineTotalCents;
    purchaserIds.add(line.userId);
    orderIds.add(line.orderId);
    const userOrders = ordersByUser.get(line.userId) ?? new Set<string>();
    userOrders.add(line.orderId);
    ordersByUser.set(line.userId, userOrders);
  }

  const repeatPurchasers = [...ordersByUser.values()].filter((orders) => orders.size >= 2).length;
  const orderCount = orderIds.size;

  return {
    dropId: lines[0]?.dropId ?? "",
    eligibleFans,
    purchasingFans: purchaserIds.size,
    orderCount,
    conversionRate: eligibleFans > 0 ? purchaserIds.size / eligibleFans : null,
    activatedRevenueCents: revenue,
    averageOrderValueCents: orderCount > 0 ? Math.round(revenue / orderCount) : null,
    repeatPurchasers,
  };
}

export function decomposePostShowGmv(
  lines: ActivationOrderLine[],
  activationDropIds: ReadonlySet<string>,
  isPostShow: (line: ActivationOrderLine) => boolean,
): PostShowGmvBreakdown {
  let postShowGmvCents = 0;
  let activatedPostShowGmvCents = 0;

  for (const line of lines) {
    if (!isPostShow(line)) continue;
    postShowGmvCents += line.lineTotalCents;
    if (isActivatedRevenueLine(line, activationDropIds)) {
      activatedPostShowGmvCents += line.lineTotalCents;
    }
  }

  return {
    postShowGmvCents,
    activatedPostShowGmvCents,
    organicPostShowGmvCents: postShowGmvCents - activatedPostShowGmvCents,
  };
}

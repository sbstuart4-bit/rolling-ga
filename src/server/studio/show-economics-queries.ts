import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { eventShowEconomics, events, venues } from "@/db/schema";
import {
  aggregateContributions,
  classifyCommerceMoment,
  type OrderEconomicsInput,
} from "@/lib/insights-economics";
import {
  buildComparisonRows,
  computeCombinedEconomics,
  computePhysicalBaseline,
  computeRollingGaBridge,
} from "@/lib/show-economics/calculations";
import {
  MARISOL_BROOKLYN_ECONOMICS_CONFIG,
  MARISOL_BROOKLYN_ECONOMICS_EVENT_ID,
  MARISOL_BROOKLYN_PHYSICAL_BASELINE,
} from "@/lib/show-economics/marisol-brooklyn-fixture";
import type {
  PhysicalBaselineInput,
  ShowEconomicsConfig,
  ShowEconomicsSnapshot,
} from "@/lib/show-economics/types";
import { DEFAULT_ROLLING_GA_PLATFORM_FEE_BPS } from "@/lib/show-economics/marisol-brooklyn-fixture";
import { assertArtistAccess } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { getEventById } from "@/server/events/queries";
import { loadShowCohortMetrics } from "@/server/studio/fan-relationship-queries";
import { loadPaidOrderLines, groupOrdersFromLines } from "@/server/studio/insights-order-lines";
import { loadActivationDropIdsForEvent } from "@/server/activation/queries";
import { decomposePostShowGmv } from "@/lib/activation/revenue";

function rowToPhysicalBaseline(
  row: typeof eventShowEconomics.$inferSelect | undefined,
): PhysicalBaselineInput {
  if (!row) {
    return {
      physicalMerchGmvCents: null,
      unitsBrought: null,
      unitsSold: null,
      stockoutCount: null,
      venueCommissionTreatment: "UNKNOWN",
      venueCommissionPercent: null,
      laborCostCents: null,
      otherPhysicalCostCents: null,
      physicalProductCostCents: null,
    };
  }

  return {
    physicalMerchGmvCents: row.physicalMerchGmvCents,
    unitsBrought: row.unitsBrought,
    unitsSold: row.unitsSold,
    stockoutCount: row.stockoutCount,
    venueCommissionTreatment: row.physicalVenueCommissionTreatment,
    venueCommissionPercent: row.physicalVenueCommissionPercent,
    laborCostCents: row.laborCostCents,
    otherPhysicalCostCents: row.otherPhysicalCostCents,
    physicalProductCostCents: row.physicalProductCostCents,
  };
}

function rowToConfig(row: typeof eventShowEconomics.$inferSelect | undefined): ShowEconomicsConfig {
  if (!row) {
    return {
      platformFeeBasisPoints: DEFAULT_ROLLING_GA_PLATFORM_FEE_BPS,
      digitalVenueCommissionTreatment: "UNKNOWN",
      digitalVenueCommissionPercent: null,
    };
  }

  return {
    platformFeeBasisPoints: row.platformFeeBasisPoints,
    digitalVenueCommissionTreatment: row.digitalVenueCommissionTreatment,
    digitalVenueCommissionPercent: row.digitalVenueCommissionPercent,
  };
}

export async function loadEventShowEconomicsRow(eventId: string) {
  const [row] = await db
    .select()
    .from(eventShowEconomics)
    .where(eq(eventShowEconomics.eventId, eventId))
    .limit(1);
  return row;
}

export async function loadShowEconomicsSnapshot(
  ctx: AuthContext,
  artistId: string,
  eventId: string,
): Promise<ShowEconomicsSnapshot | null> {
  assertArtistAccess(ctx, artistId);

  const event = await getEventById(eventId);
  if (!event || event.artistId !== artistId) return null;

  const [economicsRow, cohort, lines, activationDropIds] = await Promise.all([
    loadEventShowEconomicsRow(eventId),
    loadShowCohortMetrics(ctx, artistId, eventId),
    loadPaidOrderLines(eventId, artistId),
    loadActivationDropIdsForEvent(artistId, eventId),
  ]);

  const orderMap = groupOrdersFromLines(lines);
  const orderInputs: OrderEconomicsInput[] = [...orderMap.values()].map((order) => ({
    subtotalCents: order.subtotalCents,
    shippingCarrierCostCents: order.shippingCarrierCostCents,
    shippingCustomerChargeCents: order.shippingCustomerChargeCents,
    shippingArtistSubsidyCents: order.shippingArtistSubsidyCents,
    lines: order.lines,
  }));

  const contribution = aggregateContributions(orderInputs);

  const postShowMinutes = event.postShowWindowMinutes ?? event.tourWindowMinutes;
  const postShowClosesAt = new Date(event.endsAt.getTime() + postShowMinutes * 60_000);

  const activationLines = lines.map((line) => ({
    dropId: line.dropId,
    lineTotalCents: line.lineTotalCents,
    placedAt: line.placedAt,
    userId: line.userId,
    orderId: line.orderId,
  }));

  const postShowBreakdown = decomposePostShowGmv(
    activationLines,
    activationDropIds,
    (line) => {
      if (!line.placedAt) return false;
      const t = line.placedAt.getTime();
      return t > event.endsAt.getTime();
    },
  );

  let showNightGmv = 0;
  let postShowGmv = 0;
  let unitCount = 0;
  const purchaserIds = new Set<string>();

  for (const line of lines) {
    unitCount += line.quantity;
    purchaserIds.add(line.userId);
    const postShowMinutes = event.postShowWindowMinutes ?? event.tourWindowMinutes;
    const postShowClosesAt = new Date(event.endsAt.getTime() + postShowMinutes * 60_000);
    const moment = classifyCommerceMoment({
      placedAt: line.placedAt ?? new Date(),
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      postShowClosesAt,
      hasFlashDrop: Boolean(line.dropId?.includes("encore") || line.dropExclusivity === "flash"),
    });
    if (moment === "live" || moment === "encore_flash") showNightGmv += line.lineTotalCents;
    else if (moment === "post_show") postShowGmv += line.lineTotalCents;
  }

  const orderCount = orderMap.size;
  const gmvCents = contribution.merchRevenueCents;

  const rollingGa = {
    gmvCents,
    showNightGmvCents: cohort?.showNightGmvCents ?? showNightGmv,
    postShowGmvCents: cohort?.postShowGmv90DaysCents ?? postShowGmv,
    orderCount,
    unitCount,
    aovCents: orderCount > 0 ? Math.round(gmvCents / orderCount) : 0,
    purchasingFans: cohort?.purchasingFans ?? purchaserIds.size,
    repeatPurchasers: cohort?.repeatPurchasers ?? 0,
    fulfillmentCostCents: contribution.fulfillmentCostCents,
    shippingPaidByFanCents: [...orderMap.values()].reduce(
      (sum, o) => sum + o.shippingCustomerChargeCents,
      0,
    ),
    shippingSubsidizedByArtistCents: contribution.artistShippingSubsidyCents,
    productCostCents: contribution.productCostCents,
    productCostComplete: contribution.complete,
  };

  const physical = rowToPhysicalBaseline(economicsRow);
  const config = rowToConfig(economicsRow);
  const physicalComputed = computePhysicalBaseline(physical);
  const rollingGaBridge = computeRollingGaBridge(rollingGa, config);
  const combined = computeCombinedEconomics(physicalComputed, rollingGaBridge);

  const [venueRow] = await db
    .select({ name: venues.name, city: venues.city })
    .from(events)
    .innerJoin(venues, eq(events.venueId, venues.id))
    .where(eq(events.id, eventId))
    .limit(1);

  const eventLabel = venueRow
    ? `${venueRow.city} · ${event.tourName ?? "Show"}`
    : event.venueCity;

  return {
    eventId,
    eventLabel,
    isDemoData: cohort?.isDemoData ?? false,
    config,
    physical,
    physicalComputed,
    rollingGa,
    rollingGaBridge,
    combined,
    connectedFanRelationships: cohort?.connectedFans ?? 0,
    postShowPurchasers: cohort?.postShowPurchasers ?? 0,
    repeatPurchasers: cohort?.repeatPurchasers ?? 0,
    postShowRelationshipGmvCents: cohort?.postShowGmv90DaysCents ?? rollingGa.postShowGmvCents,
    activatedPostShowGmvCents: postShowBreakdown.activatedPostShowGmvCents,
    organicPostShowGmvCents: postShowBreakdown.organicPostShowGmvCents,
    comparisonRows: buildComparisonRows(),
  };
}

export function emptyPhysicalBaseline(): PhysicalBaselineInput {
  return rowToPhysicalBaseline(undefined);
}

export function marisolBrooklynSeedEconomics() {
  return {
    eventId: MARISOL_BROOKLYN_ECONOMICS_EVENT_ID,
    config: MARISOL_BROOKLYN_ECONOMICS_CONFIG,
    physical: MARISOL_BROOKLYN_PHYSICAL_BASELINE,
  };
}

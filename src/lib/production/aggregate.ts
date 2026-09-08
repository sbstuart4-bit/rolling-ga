import type { ProductionVariantGroup, ProductionWorkUnit } from "./types";
import { compareProductionPriority } from "./priority";

export function variantGroupKey(input: {
  eventId: string | null;
  productId: string | null;
  variantId: string | null;
  size: string | null;
}): string {
  return [input.eventId ?? "none", input.productId ?? "none", input.variantId ?? input.size ?? "none"].join(
    ":",
  );
}

export function aggregateVariantGroups(units: ProductionWorkUnit[]): ProductionVariantGroup[] {
  const map = new Map<string, ProductionVariantGroup>();

  for (const unit of units) {
    if (unit.requirementMode !== "on_demand") continue;
    const groupKey = variantGroupKey({
      eventId: unit.eventId,
      productId: unit.productId,
      variantId: unit.variantId,
      size: unit.size,
    });

    const existing = map.get(groupKey) ?? {
      groupKey,
      artistName: unit.artistName,
      eventId: unit.eventId,
      showLabel: unit.showLabel,
      tourName: null,
      productId: unit.productId,
      productName: unit.productName,
      variantId: unit.variantId,
      size: unit.size,
      unitsQueued: 0,
      unitsInProduction: 0,
      unitsComplete: 0,
      unitsRemaining: 0,
      unitsAtRisk: 0,
      orderIds: [],
      orderCount: 0,
      earliestPromise: null,
      priority: unit.priority,
      priorityReason: unit.priorityReason,
      priorityLabel: unit.priorityLabel,
      workIds: [],
    };

    if (unit.status === "queued") existing.unitsQueued += 1;
    if (unit.status === "in_production") existing.unitsInProduction += 1;
    if (unit.status === "complete") existing.unitsComplete += 1;
    if (unit.status !== "complete") {
      existing.unitsRemaining += 1;
      if (unit.promiseState === "at_risk" || unit.promiseState === "past_promise") {
        existing.unitsAtRisk += 1;
      }
    }

    if (!existing.orderIds.includes(unit.orderId)) existing.orderIds.push(unit.orderId);
    existing.workIds.push(unit.id);

    if (unit.promisedDeliveryAt) {
      if (!existing.earliestPromise || unit.promisedDeliveryAt < existing.earliestPromise) {
        existing.earliestPromise = unit.promisedDeliveryAt;
      }
    }

    if (unit.priority < existing.priority) {
      existing.priority = unit.priority;
      existing.priorityReason = unit.priorityReason;
      existing.priorityLabel = unit.priorityLabel;
    }

    map.set(groupKey, existing);
  }

  const groups = [...map.values()].map((g) => ({
    ...g,
    orderCount: g.orderIds.length,
  }));

  groups.sort((a, b) =>
    compareProductionPriority(
      { priority: a.priority, promisedDeliveryAt: a.earliestPromise, queuedAt: new Date(0) },
      { priority: b.priority, promisedDeliveryAt: b.earliestPromise, queuedAt: new Date(0) },
    ),
  );

  return groups;
}

export function ordersBlockedByEvent(units: ProductionWorkUnit[]): Map<string, number> {
  const blocked = new Map<string, Set<string>>();

  for (const unit of units) {
    if (!unit.eventId || unit.requirementMode !== "on_demand" || unit.status === "complete") continue;
    const set = blocked.get(unit.eventId) ?? new Set<string>();
    set.add(unit.orderId);
    blocked.set(unit.eventId, set);
  }

  const counts = new Map<string, number>();
  for (const [eventId, orderIds] of blocked) {
    counts.set(eventId, orderIds.size);
  }
  return counts;
}

export function summarizeProductionByShow(
  groups: ProductionVariantGroup[],
  meta: Map<string, { tourName: string | null; venueCity: string }>,
  ordersBlockedByEvent: Map<string, number>,
): import("./types").ProductionShowSummary[] {
  const byEvent = new Map<string, import("./types").ProductionShowSummary>();

  for (const group of groups) {
    if (!group.eventId) continue;
    const eventMeta = meta.get(group.eventId);
    const existing = byEvent.get(group.eventId) ?? {
      eventId: group.eventId,
      artistName: group.artistName,
      tourName: eventMeta?.tourName ?? group.tourName,
      venueCity: eventMeta?.venueCity ?? group.showLabel.split(" · ")[0] ?? "—",
      unitsRemaining: 0,
      unitsAtRisk: 0,
      ordersBlocked: ordersBlockedByEvent.get(group.eventId) ?? 0,
      unitsQueued: 0,
      unitsInProduction: 0,
    };

    existing.unitsRemaining += group.unitsRemaining;
    existing.unitsAtRisk += group.unitsAtRisk;
    existing.unitsQueued += group.unitsQueued;
    existing.unitsInProduction += group.unitsInProduction;

    byEvent.set(group.eventId, existing);
  }

  return [...byEvent.values()].sort((a, b) => b.unitsAtRisk - a.unitsAtRisk || b.unitsRemaining - a.unitsRemaining);
}

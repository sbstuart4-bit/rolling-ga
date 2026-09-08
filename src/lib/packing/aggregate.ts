import type { PackOrderCard, PackQueueSnapshot, PackShowSummary } from "./types";
import { comparePackPriority } from "./priority";

export function summarizePackingByShow(orders: PackOrderCard[]): PackShowSummary[] {
  const byEvent = new Map<string, PackShowSummary>();

  for (const order of orders) {
    if (!order.eventId) continue;
    const existing = byEvent.get(order.eventId) ?? {
      eventId: order.eventId,
      artistName: order.artistName,
      tourName: null,
      venueCity: order.showLabel.split(" · ")[0] ?? "—",
      readyToPack: 0,
      packing: 0,
      readyForHandoff: 0,
      handedToCarrier: 0,
      atRisk: 0,
      mustLeaveNext: 0,
    };

    if (order.operationalState === "ready_to_pack") existing.readyToPack += 1;
    if (order.operationalState === "packing") existing.packing += 1;
    if (order.operationalState === "ready_for_handoff" || order.operationalState === "packed") {
      existing.readyForHandoff += order.operationalState === "ready_for_handoff" ? 1 : 0;
    }
    if (order.operationalState === "handed_to_carrier") existing.handedToCarrier += 1;
    if (order.promiseState === "at_risk" || order.promiseState === "past_promise") {
      existing.atRisk += 1;
    }
    if (
      ["ready_for_handoff", "handed_to_carrier", "packed", "packing", "ready_to_pack"].includes(
        order.operationalState,
      )
    ) {
      existing.mustLeaveNext += 1;
    }

    byEvent.set(order.eventId, existing);
  }

  return [...byEvent.values()].sort((a, b) => b.mustLeaveNext - a.mustLeaveNext);
}

export function buildPackQueueSnapshot(
  orders: PackOrderCard[],
  generatedAt: Date,
): PackQueueSnapshot {
  const readyToPack = orders.filter((o) => o.operationalState === "ready_to_pack");
  const packing = orders.filter((o) => o.operationalState === "packing");
  const packed = orders.filter((o) => o.operationalState === "packed");
  const readyForHandoff = orders.filter((o) => o.operationalState === "ready_for_handoff");
  const handedToCarrier = orders.filter((o) => o.operationalState === "handed_to_carrier");
  const blocked = orders.filter((o) => o.operationalState === "blocked");
  const atRisk = orders.filter(
    (o) =>
      o.promiseState === "at_risk" || o.promiseState === "past_promise",
  );
  const pastPromise = orders.filter((o) => o.promiseState === "past_promise");

  const mustLeaveNext = [...orders]
    .filter((o) =>
      ["ready_to_pack", "packing", "packed", "ready_for_handoff", "handed_to_carrier"].includes(
        o.operationalState,
      ),
    )
    .sort((a, b) =>
      comparePackPriority(
        { priority: a.priority, promisedDeliveryAt: a.promisedDeliveryAt, placedAt: a.packedAt },
        { priority: b.priority, promisedDeliveryAt: b.promisedDeliveryAt, placedAt: b.packedAt },
      ),
    )
    .slice(0, 12);

  return {
    generatedAt,
    summary: {
      readyToPack: readyToPack.length,
      packing: packing.length,
      packed: packed.length,
      readyForHandoff: readyForHandoff.length,
      handedToCarrier: handedToCarrier.length,
      mustLeaveNext: mustLeaveNext.length,
      atRisk: atRisk.length,
      pastPromise: pastPromise.length,
      blocked: blocked.length,
    },
    mustLeaveNext,
    readyToPack: sortPackOrders(readyToPack),
    readyForHandoff: sortPackOrders(readyForHandoff),
    blocked: sortPackOrders(blocked),
    allOrders: sortPackOrders(orders),
    showSummaries: summarizePackingByShow(orders),
  };
}

function sortPackOrders(orders: PackOrderCard[]): PackOrderCard[] {
  return [...orders].sort((a, b) =>
    comparePackPriority(
      { priority: a.priority, promisedDeliveryAt: a.promisedDeliveryAt, placedAt: a.packedAt },
      { priority: b.priority, promisedDeliveryAt: b.promisedDeliveryAt, placedAt: b.packedAt },
    ),
  );
}

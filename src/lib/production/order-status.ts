import type { ProductionWorkStatus } from "@/lib/types";
import type { OrderProductionLineProgress, OrderProductionStatus } from "./types";
import { requiresProductionWork } from "./mode";

export interface ProductionWorkRow {
  orderItemId: string;
  productName: string;
  size: string | null;
  status: ProductionWorkStatus;
  requirementMode: "on_demand" | "stocked";
}

export function aggregateLineProgress(rows: ProductionWorkRow[]): OrderProductionLineProgress[] {
  const byItem = new Map<string, OrderProductionLineProgress>();

  for (const row of rows) {
    const existing = byItem.get(row.orderItemId) ?? {
      orderItemId: row.orderItemId,
      productName: row.productName,
      size: row.size,
      requiredUnits: 0,
      completeUnits: 0,
      inProductionUnits: 0,
      queuedUnits: 0,
      requirementMode: row.requirementMode,
    };

    if (requiresProductionWork(row.requirementMode)) {
      existing.requiredUnits += 1;
      if (row.status === "complete") existing.completeUnits += 1;
      if (row.status === "in_production") existing.inProductionUnits += 1;
      if (row.status === "queued") existing.queuedUnits += 1;
    }

    byItem.set(row.orderItemId, existing);
  }

  return [...byItem.values()];
}

export function isOrderProductionComplete(rows: ProductionWorkRow[]): boolean {
  const onDemand = rows.filter((r) => requiresProductionWork(r.requirementMode));
  if (onDemand.length === 0) return true;
  return onDemand.every((r) => r.status === "complete");
}

export function deriveOrderProductionStatus(
  rows: ProductionWorkRow[],
  fulfillmentStatus: string | null,
): OrderProductionStatus {
  const lines = aggregateLineProgress(rows);
  const onDemandLines = lines.filter((l) => requiresProductionWork(l.requirementMode));

  if (onDemandLines.length === 0) {
    return {
      lines,
      isProductionComplete: true,
      readyToPack: false,
      orderProductionState: "not_applicable",
    };
  }

  const isProductionComplete = onDemandLines.every(
    (l) => l.completeUnits >= l.requiredUnits && l.requiredUnits > 0,
  );
  const anyStarted = onDemandLines.some(
    (l) => l.inProductionUnits > 0 || l.completeUnits > 0,
  );
  const readyToPack =
    isProductionComplete &&
    fulfillmentStatus != null &&
    ["received", "production", "exception"].includes(fulfillmentStatus);

  return {
    lines,
    isProductionComplete,
    readyToPack,
    orderProductionState: readyToPack
      ? "ready_to_pack"
      : isProductionComplete
        ? "ready_to_pack"
        : anyStarted
          ? "in_progress"
          : "waiting",
  };
}

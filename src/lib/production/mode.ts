import type { ProductionRequirementMode } from "@/lib/types";

/**
 * Production requirement rule (Ops Phase 2):
 * - Digital products (`isDigital`) are STOCKED — no queue demand.
 * - All other physical catalog items are ON_DEMAND — each unit enters production_work.
 */
export function resolveProductionRequirementMode(isDigital: boolean | null | undefined): ProductionRequirementMode {
  return isDigital ? "stocked" : "on_demand";
}

export function requiresProductionWork(mode: ProductionRequirementMode): boolean {
  return mode === "on_demand";
}

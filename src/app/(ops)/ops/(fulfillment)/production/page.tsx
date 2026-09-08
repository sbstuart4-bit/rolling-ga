import type { Metadata } from "next";
import { OpsAutoRefresh } from "@/components/ops/ops-auto-refresh";
import { OpsProductionQueue } from "@/components/ops/ops-production-queue";
import { demoModeEnabled } from "@/lib/demo-mode";
import type { ProductionQueueFilter } from "@/lib/production";
import { ensureOpsDemoClock } from "@/server/ops/demo-clock";
import { loadProductionQueue } from "@/server/ops/production-queries";
import { requireAuthWithRole } from "@/server/auth/request";

export const metadata: Metadata = { title: "Production — Rolling GA Ops" };
export const dynamic = "force-dynamic";

function parseFilter(raw: string | undefined): ProductionQueueFilter {
  if (
    raw === "queued" ||
    raw === "in_production" ||
    raw === "at_risk" ||
    raw === "complete"
  ) {
    return raw;
  }
  return "all";
}

export default async function OpsProductionPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; event?: string }>;
}) {
  const ctx = await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops/production");
  if (demoModeEnabled()) {
    await ensureOpsDemoClock();
  }

  const { filter: filterParam, event } = await searchParams;
  const filter = parseFilter(filterParam);
  const snapshot = await loadProductionQueue(ctx, filter, event ?? null);

  return (
    <>
      <OpsAutoRefresh />
      <OpsProductionQueue snapshot={snapshot} filter={filter} eventId={event} />
    </>
  );
}

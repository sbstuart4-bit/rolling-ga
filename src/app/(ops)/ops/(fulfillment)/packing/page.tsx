import type { Metadata } from "next";
import { OpsAutoRefresh } from "@/components/ops/ops-auto-refresh";
import { OpsPackingQueue } from "@/components/ops/ops-packing-queue";
import { demoModeEnabled } from "@/lib/demo-mode";
import type { PackQueueFilter } from "@/lib/packing";
import { ensureOpsDemoClock } from "@/server/ops/demo-clock";
import { loadPackingQueue } from "@/server/ops/packing-queries";
import { requireAuthWithRole } from "@/server/auth/request";

export const metadata: Metadata = { title: "Packing — Rolling GA Ops" };
export const dynamic = "force-dynamic";

function parseFilter(raw: string | undefined): PackQueueFilter {
  if (
    raw === "ready_to_pack" ||
    raw === "packing" ||
    raw === "ready_for_handoff" ||
    raw === "handed_to_carrier" ||
    raw === "blocked" ||
    raw === "at_risk"
  ) {
    return raw;
  }
  return "all";
}

export default async function OpsPackingPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; event?: string }>;
}) {
  const ctx = await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops/packing");
  if (demoModeEnabled()) {
    await ensureOpsDemoClock();
  }

  const { filter: filterParam, event } = await searchParams;
  const filter = parseFilter(filterParam);
  const snapshot = await loadPackingQueue(ctx, filter, event ?? null);

  return (
    <>
      <OpsAutoRefresh />
      <OpsPackingQueue snapshot={snapshot} filter={filter} eventId={event} />
    </>
  );
}

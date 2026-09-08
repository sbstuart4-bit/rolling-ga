import type { Metadata } from "next";
import { OpsAutoRefresh } from "@/components/ops/ops-auto-refresh";
import { OpsCommandCenter } from "@/components/ops/ops-command-center";
import { demoModeEnabled } from "@/lib/demo-mode";
import type { OpsShowFilter } from "@/lib/ops";
import { ensureOpsDemoClock } from "@/server/ops/demo-clock";
import { loadOpsCommandCenter } from "@/server/ops/fulfillment-queries";
import { requireAuthWithRole } from "@/server/auth/request";

export const metadata: Metadata = { title: "Command Center — Rolling GA Ops" };
export const dynamic = "force-dynamic";

function parseFilter(raw: string | undefined): OpsShowFilter {
  if (raw === "live" || raw === "fulfilling" || raw === "at_risk" || raw === "complete") {
    return raw;
  }
  return "all";
}

export default async function OpsCommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const ctx = await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops");
  if (demoModeEnabled()) {
    await ensureOpsDemoClock();
  }

  const { filter: filterParam } = await searchParams;
  const filter = parseFilter(filterParam);
  const snapshot = await loadOpsCommandCenter(ctx, filter);

  return (
    <>
      <OpsAutoRefresh />
      <OpsCommandCenter snapshot={snapshot} filter={filter} />
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpsAutoRefresh } from "@/components/ops/ops-auto-refresh";
import { OpsShowDetail } from "@/components/ops/ops-show-detail";
import { demoModeEnabled } from "@/lib/demo-mode";
import { ensureOpsDemoClock } from "@/server/ops/demo-clock";
import { loadOpsShowDetail } from "@/server/ops/fulfillment-queries";
import { loadShowExceptionSummary } from "@/server/ops/exception-queries";
import { requireAuthWithRole } from "@/server/auth/request";

export const metadata: Metadata = { title: "Show Operations — Rolling GA Ops" };
export const dynamic = "force-dynamic";

export default async function OpsShowPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const ctx = await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops");
  if (demoModeEnabled()) {
    await ensureOpsDemoClock();
  }

  const { eventId } = await params;
  const detail = await loadOpsShowDetail(ctx, eventId);
  if (!detail) notFound();
  const exceptionSummary = await loadShowExceptionSummary(ctx, eventId);

  return (
    <>
      <OpsAutoRefresh />
      <OpsShowDetail
        show={detail.show}
        orders={detail.orders}
        attention={detail.attention}
        exceptionSummary={exceptionSummary}
      />
    </>
  );
}

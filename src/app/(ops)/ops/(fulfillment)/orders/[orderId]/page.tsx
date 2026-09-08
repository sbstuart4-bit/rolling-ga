import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FulfillmentOrderDetailPanel } from "@/components/studio/fulfillment-order-detail";
import { OpsOrderExceptionsPanel } from "@/components/ops/ops-order-exceptions-panel";
import { OpsOrderPackingPanel } from "@/components/ops/ops-order-packing-panel";
import { PackingOrderActions } from "@/components/ops/packing-order-actions";
import { OpsOrderProductionPanel } from "@/components/ops/ops-order-production-panel";
import { demoModeEnabled } from "@/lib/demo-mode";
import { opsShowHref } from "@/lib/ops";
import { ensureOpsDemoClock } from "@/server/ops/demo-clock";
import { loadOpsFulfillmentOrderDetail } from "@/server/ops/fulfillment-queries";
import { loadOrderProductionStatus } from "@/server/ops/production-queries";
import { loadOrderPackingStatus } from "@/server/ops/packing-queries";
import { requireAuthWithRole } from "@/server/auth/request";

export const metadata: Metadata = { title: "Order — Rolling GA Ops" };
export const dynamic = "force-dynamic";

export default async function OpsOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const ctx = await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops");
  if (demoModeEnabled()) {
    await ensureOpsDemoClock();
  }

  const { orderId } = await params;
  const order = await loadOpsFulfillmentOrderDetail(ctx, orderId);
  if (!order) notFound();

  const productionStatus = await loadOrderProductionStatus(ctx, orderId);
  const packingStatus = await loadOrderPackingStatus(ctx, orderId);
  const backHref = order.eventId ? opsShowHref(order.eventId) : "/ops";

  return (
    <div className="text-white">
      <p className="mb-6 text-xs text-zinc-500">
        {order.artistName} · Ops order inspection
      </p>
      <OpsOrderExceptionsPanel exceptions={order.exceptions} />
      <OpsOrderProductionPanel status={productionStatus} />
      <OpsOrderPackingPanel order={packingStatus} />
      {packingStatus ? (
        <div className="mb-8">
          <PackingOrderActions
            orderId={orderId}
            operationalState={packingStatus.operationalState}
          />
        </div>
      ) : null}
      <FulfillmentOrderDetailPanel order={order} backHref={backHref} />
    </div>
  );
}

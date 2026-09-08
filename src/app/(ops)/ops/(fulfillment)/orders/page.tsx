import type { Metadata } from "next";
import Link from "next/link";
import { DELIVERY_PROMISE_STATE_LABELS } from "@/lib/fulfillment";
import { formatMoney } from "@/lib/format";
import { opsOrderHref } from "@/lib/ops";
import { FULFILLMENT_STATUS_LABELS } from "@/lib/types";
import { demoModeEnabled } from "@/lib/demo-mode";
import { requireAuthWithRole } from "@/server/auth/request";
import { ensureOpsDemoClock } from "@/server/ops/demo-clock";
import { loadOpsCommandCenter } from "@/server/ops/fulfillment-queries";

export const metadata: Metadata = { title: "Orders — Rolling GA Ops" };
export const dynamic = "force-dynamic";

export default async function OpsOrdersPage() {
  const ctx = await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops/orders");
  if (demoModeEnabled()) {
    await ensureOpsDemoClock();
  }

  const snapshot = await loadOpsCommandCenter(ctx, "all");
  const orders = snapshot.attention;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Orders needing review</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Prioritized by promise urgency and open exceptions. Full order management ships in later Ops
          phases.
        </p>
      </header>

      {orders.length === 0 ? (
        <p className="text-zinc-500">No prioritized orders right now.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-zinc-500">
                {["Order", "Artist", "Show", "Status", "Promise", "Reason"].map((h) => (
                  <th key={h} className="pb-2 pr-4 font-medium last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.map((order) => (
                <tr key={order.orderId} className="hover:bg-white/[0.03]">
                  <td className="py-3 pr-4">
                    <Link href={opsOrderHref(order.orderId)} className="font-mono text-sky-300 hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-zinc-400">{order.artistName}</td>
                  <td className="py-3 pr-4 text-zinc-400">{order.showLabel}</td>
                  <td className="py-3 pr-4">
                    {order.fulfillmentStatus
                      ? FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus]
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 text-zinc-400">
                    {DELIVERY_PROMISE_STATE_LABELS[order.promiseState]}
                  </td>
                  <td className="py-3 pr-4 text-amber-200">{order.reasonLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-zinc-600">
        Tip: open a show from the{" "}
        <Link href="/ops" className="text-sky-400 hover:underline">command center</Link> for full
        pipeline context.
      </p>
    </div>
  );
}

import { formatDateTime } from "@/lib/format";
import {
  PACK_OPERATIONAL_STATE_LABELS,
  type PackOrderCard,
} from "@/lib/packing";
import { cn } from "@/lib/utils";

export function OpsOrderPackingPanel({ order }: { order: PackOrderCard | null }) {
  if (!order) return null;

  const tone =
    order.operationalState === "blocked"
      ? "text-red-300"
      : order.operationalState === "ready_for_handoff" || order.operationalState === "handed_to_carrier"
        ? "text-violet-300"
        : order.operationalState === "ready_to_pack"
          ? "text-emerald-300"
          : "text-sky-300";

  return (
    <section className="mb-8 space-y-4 rounded-2xl border border-white/10 bg-[#10141c] p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Packing
        </h2>
        <p className={cn("text-sm font-semibold uppercase tracking-[0.12em]", tone)}>
          {PACK_OPERATIONAL_STATE_LABELS[order.operationalState]}
        </p>
      </div>

      <ul className="space-y-2 text-sm text-zinc-400">
        {order.packingStartedAt ? (
          <li>Packing started {formatDateTime(order.packingStartedAt)}</li>
        ) : null}
        {order.packedAt ? <li>Packed {formatDateTime(order.packedAt)}</li> : null}
        {order.readyForHandoffAt ? (
          <li>Ready for handoff {formatDateTime(order.readyForHandoffAt)}</li>
        ) : null}
        {order.handedToCarrierAt ? (
          <li>Handed to carrier {formatDateTime(order.handedToCarrierAt)}</li>
        ) : null}
        {order.shippedAt ? (
          <li className="text-zinc-500">Shipped {formatDateTime(order.shippedAt)} (downstream)</li>
        ) : null}
      </ul>

      {order.blockedReason ? (
        <p className="text-sm text-red-300">{order.blockedReason}</p>
      ) : null}

      {order.handoffTargetAt ? (
        <p className="text-sm text-zinc-500">
          Internal handoff target: {formatDateTime(order.handoffTargetAt)}
        </p>
      ) : null}

      {order.shipment.carrier || order.shipment.trackingNumber ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Shipment
          </p>
          <p className="mt-2 text-sm">
            {order.shipment.carrier ?? "Carrier TBD"}
            {order.shipment.service ? ` · ${order.shipment.service}` : ""}
          </p>
          {order.shipment.trackingNumber ? (
            <p className="mt-1 font-mono text-xs text-zinc-400">{order.shipment.trackingNumber}</p>
          ) : null}
          {order.handedToCarrierAt && !order.shippedAt ? (
            <p className="mt-2 text-xs text-violet-300">
              Handed to carrier is not the same as shipped — no carrier scan implied.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

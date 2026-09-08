import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import {
  PACK_OPERATIONAL_STATE_LABELS,
  opsPackingHref,
  type PackOrderCard,
  type PackQueueSnapshot,
} from "@/lib/packing";
import { opsOrderHref, opsExceptionHref } from "@/lib/ops";
import { PackingOrderActions } from "@/components/ops/packing-order-actions";
import { cn } from "@/lib/utils";

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
          highlight ? "text-amber-200" : "text-white",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PackOrderCardView({ order }: { order: PackOrderCard }) {
  const urgent =
    order.promiseState === "past_promise" ||
    order.promiseState === "at_risk" ||
    order.operationalState === "blocked";

  return (
    <article
      className={cn(
        "rounded-2xl border p-5",
        urgent ? "border-amber-500/20 bg-amber-500/5" : "border-white/10 bg-[#10141c]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={opsOrderHref(order.orderId)} className="font-mono text-lg font-semibold hover:text-sky-300">
            {order.orderNumber}
          </Link>
          <p className="text-sm text-zinc-400">{order.artistName} · {order.showLabel}</p>
          {order.activationDropTitle ? (
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-300">
              {order.activationDropTitle}
            </p>
          ) : null}
        </div>
        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-amber-200">
          {order.priorityLabel}
        </span>
      </div>

      <div className="mt-4 space-y-1 text-sm text-zinc-400">
        {order.lines.map((line, i) => (
          <p key={`${line.productName}-${i}`}>
            {line.productName}
            {line.size ? ` · ${line.size}` : ""}
            {line.quantity > 1 ? ` × ${line.quantity}` : ""}
          </p>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Items</p>
          <p className="font-semibold tabular-nums">{order.unitCount}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Status</p>
          <p className="font-semibold">{PACK_OPERATIONAL_STATE_LABELS[order.operationalState]}</p>
        </div>
        {order.promisedDeliveryAt ? (
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Promise</p>
            <p className="font-semibold">{formatDateTime(order.promisedDeliveryAt)}</p>
          </div>
        ) : null}
        {order.handoffTargetAt ? (
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Handoff target</p>
            <p className="font-semibold">{formatDateTime(order.handoffTargetAt)}</p>
          </div>
        ) : null}
      </div>

      {order.blockedReason ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-red-300">{order.blockedReason}</p>
          {order.openExceptionId ? (
            <Link
              href={opsExceptionHref(order.openExceptionId)}
              className="inline-block text-sm font-medium text-sky-300 hover:text-sky-200"
            >
              Resolve issue →
            </Link>
          ) : null}
        </div>
      ) : null}

      {order.shipment.carrier ? (
        <p className="mt-3 text-xs text-zinc-500">
          {order.shipment.carrier}
          {order.shipment.service ? ` · ${order.shipment.service}` : ""}
          {order.shipment.trackingNumber ? ` · ${order.shipment.trackingNumber}` : ""}
        </p>
      ) : null}

      <div className="mt-4">
        <PackingOrderActions orderId={order.orderId} operationalState={order.operationalState} />
      </div>
    </article>
  );
}

export function OpsPackingQueue({
  snapshot,
  filter,
  eventId,
}: {
  snapshot: PackQueueSnapshot;
  filter: string;
  eventId?: string;
}) {
  const filters = [
    { id: "all", label: "All" },
    { id: "ready_to_pack", label: "Ready to pack" },
    { id: "packing", label: "Packing" },
    { id: "ready_for_handoff", label: "Ready for handoff" },
    { id: "handed_to_carrier", label: "Handed to carrier" },
    { id: "blocked", label: "Blocked" },
    { id: "at_risk", label: "At risk" },
  ];

  const earliestPromise = snapshot.mustLeaveNext[0]?.promisedDeliveryAt;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400">
          Rolling GA Ops
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Pack + carrier handoff</h1>
        <p className="text-lg text-zinc-400">What needs to leave next to protect the promise?</p>
        <p className="text-xs text-zinc-600">Updated {formatDateTime(snapshot.generatedAt)}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Metric label="Must leave next" value={String(snapshot.summary.mustLeaveNext)} highlight />
        <Metric label="Ready to pack" value={String(snapshot.summary.readyToPack)} />
        <Metric label="Packing" value={String(snapshot.summary.packing)} />
        <Metric label="Packed" value={String(snapshot.summary.packed)} />
        <Metric label="Ready for handoff" value={String(snapshot.summary.readyForHandoff)} />
        <Metric label="Handed to carrier" value={String(snapshot.summary.handedToCarrier)} />
        <Metric label="At risk" value={String(snapshot.summary.atRisk)} highlight />
        <Metric label="Blocked" value={String(snapshot.summary.blocked)} highlight />
      </section>

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-300">
          Must leave next
        </h2>
        <p className="mt-2 text-2xl font-semibold tabular-nums">
          {snapshot.summary.mustLeaveNext} orders must leave next
        </p>
        {earliestPromise ? (
          <p className="mt-1 text-sm text-zinc-400">
            Earliest promise: {formatDateTime(earliestPromise)}
          </p>
        ) : null}
        <p className="mt-1 text-sm text-amber-200">{snapshot.summary.atRisk} at risk</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Must leave next
        </h2>
        {snapshot.mustLeaveNext.length === 0 ? (
          <p className="text-sm text-zinc-500">No outbound orders in queue.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {snapshot.mustLeaveNext.map((order) => (
              <PackOrderCardView key={order.orderId} order={order} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">By show</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {snapshot.showSummaries.map((show) => (
            <div key={show.eventId} className="rounded-xl border border-white/10 bg-[#10141c] p-4">
              <p className="font-semibold">{show.artistName}</p>
              <p className="text-sm text-zinc-400">{show.venueCity}</p>
              <p className="mt-3 text-sm text-zinc-300">
                {show.readyToPack} ready to pack · {show.readyForHandoff} ready for handoff ·{" "}
                {show.mustLeaveNext} must leave
              </p>
              <Link
                href={opsPackingHref("all", show.eventId)}
                className="mt-3 inline-block text-sm text-sky-300 hover:text-sky-200"
              >
                View pack queue →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Link
              key={f.id}
              href={opsPackingHref(f.id, eventId)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.1em]",
                filter === f.id
                  ? "bg-sky-500/20 text-sky-200"
                  : "bg-white/5 text-zinc-500 hover:text-zinc-300",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Pack queue
        </h2>
        <div className="space-y-3">
          {snapshot.allOrders.map((order) => (
            <PackOrderCardView key={`all-${order.orderId}`} order={order} />
          ))}
        </div>
      </section>
    </div>
  );
}

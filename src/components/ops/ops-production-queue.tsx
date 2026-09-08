import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { opsExceptionHref, opsShowHref } from "@/lib/ops";
import { opsProductionHref, type ProductionQueueSnapshot } from "@/lib/production";
import { ProductionGroupActions } from "@/components/ops/production-group-actions";
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

function VariantGroupCard({
  group,
}: {
  group: ProductionQueueSnapshot["urgentGroups"][number];
}) {
  const canStart = group.unitsQueued > 0;
  const canComplete = group.unitsInProduction > 0;

  return (
    <article className="rounded-2xl border border-white/10 bg-[#10141c] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{group.productName}</p>
          <p className="text-sm text-zinc-400">
            {group.size ? `Size ${group.size}` : "One size"} · {group.artistName}
          </p>
          <p className="text-sm text-zinc-500">{group.showLabel}</p>
        </div>
        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-amber-200">
          {group.priorityLabel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Remaining</p>
          <p className="text-xl font-semibold tabular-nums">{group.unitsRemaining}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Queued</p>
          <p className="text-xl font-semibold tabular-nums">{group.unitsQueued}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-zinc-500">In production</p>
          <p className="text-xl font-semibold tabular-nums">{group.unitsInProduction}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-zinc-500">At risk</p>
          <p className="text-xl font-semibold tabular-nums text-amber-200">{group.unitsAtRisk}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        {group.orderCount} orders
        {group.earliestPromise ? ` · Earliest promise ${formatDateTime(group.earliestPromise)}` : ""}
      </p>

      <div className="mt-4">
        <ProductionGroupActions workIds={group.workIds} canStart={canStart} canComplete={canComplete} />
      </div>
    </article>
  );
}

export function OpsProductionQueue({
  snapshot,
  filter,
  eventId,
}: {
  snapshot: ProductionQueueSnapshot;
  filter: string;
  eventId?: string;
}) {
  const filters = [
    { id: "all", label: "All" },
    { id: "queued", label: "Queued" },
    { id: "in_production", label: "In production" },
    { id: "at_risk", label: "At risk" },
    { id: "complete", label: "Complete" },
  ];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400">
          Rolling GA Ops
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Production queue</h1>
        <p className="text-lg text-zinc-400">What needs to be made next to protect the promise?</p>
        <p className="text-xs text-zinc-600">Updated {formatDateTime(snapshot.generatedAt)}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Metric label="Needs production now" value={String(snapshot.summary.unitsNeedsProductionNow)} highlight />
        <Metric label="Units queued" value={String(snapshot.summary.unitsQueued)} />
        <Metric label="In production" value={String(snapshot.summary.unitsInProduction)} />
        <Metric label="Complete" value={String(snapshot.summary.unitsComplete)} />
        <Metric label="At risk" value={String(snapshot.summary.unitsAtRisk)} highlight />
        <Metric label="Past promise" value={String(snapshot.summary.unitsPastPromise)} highlight />
        <Metric label="Orders waiting" value={String(snapshot.summary.ordersWaitingOnProduction)} />
      </section>

      <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100">
        <span className="font-semibold">{snapshot.summary.ordersReadyToPack}</span> orders ready to
        pack when all units are complete — packing workflow ships in Ops Phase 3.
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-red-300">
          Blocked by exception
        </h2>
        {snapshot.blockedOrders.length === 0 ? (
          <p className="text-sm text-zinc-500">No production orders blocked by open exceptions.</p>
        ) : (
          <div className="space-y-3">
            {snapshot.blockedOrders.map((order) => (
              <div
                key={order.orderId}
                className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4"
              >
                <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
                <p className="text-sm text-zinc-400">{order.artistName} · {order.showLabel}</p>
                <p className="mt-1 text-sm text-amber-200 capitalize">
                  {order.exceptionType.replace(/_/g, " ")}
                </p>
                {order.openExceptionId ? (
                  <Link
                    href={opsExceptionHref(order.openExceptionId)}
                    className="mt-3 inline-block text-sm font-medium text-sky-300 hover:text-sky-200"
                  >
                    Resolve issue →
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-300">
          Needs production now
        </h2>
        {snapshot.urgentGroups.length === 0 ? (
          <p className="text-sm text-zinc-500">No active production demand.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {snapshot.urgentGroups.map((group) => (
              <VariantGroupCard key={group.groupKey} group={group} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">By show</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {snapshot.showSummaries.map((show) => (
            <div
              key={show.eventId}
              className="rounded-xl border border-white/10 bg-[#10141c] p-4"
            >
              <p className="font-semibold">{show.artistName}</p>
              <p className="text-sm text-zinc-400">{show.tourName} · {show.venueCity}</p>
              <p className="mt-3 text-sm text-zinc-300">
                {show.unitsRemaining} units remaining · {show.unitsAtRisk} at risk
                {show.ordersBlocked > 0 ? ` · ${show.ordersBlocked} orders blocked` : ""}
              </p>
              <Link
                href={opsProductionHref("all", show.eventId)}
                className="mt-3 inline-block text-sm text-sky-300 hover:text-sky-200"
              >
                View queue →
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
              href={opsProductionHref(f.id, eventId)}
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
          By product / variant
        </h2>
        <div className="space-y-3">
          {snapshot.variantGroups.map((group) => (
            <VariantGroupCard key={`all-${group.groupKey}`} group={group} />
          ))}
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import {
  SHOW_OPERATIONAL_HEALTH_LABELS,
  SHOW_OPERATIONAL_STATE_LABELS,
  opsOrderHref,
  opsShowHref,
  type OpsAttentionItem,
  type OpsCommandCenterSnapshot,
  type OpsShowMetrics,
} from "@/lib/ops";
import { OpsAttentionExceptionLink } from "@/components/ops/ops-exceptions-workbench";
import { cn } from "@/lib/utils";

function HealthBadge({ health }: { health: OpsShowMetrics["health"] }) {
  const tone =
    health === "on_track"
      ? "bg-emerald-500/15 text-emerald-300"
      : health === "watch"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-red-500/15 text-red-300";

  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase", tone)}>
      {SHOW_OPERATIONAL_HEALTH_LABELS[health]}
    </span>
  );
}

function StateBadge({ state }: { state: OpsShowMetrics["operationalState"] }) {
  const tone =
    state === "live"
      ? "text-sky-300"
      : state === "at_risk"
        ? "text-red-300"
        : state === "fulfilling"
          ? "text-violet-300"
          : state === "complete"
            ? "text-emerald-300"
            : "text-zinc-400";

  return (
    <span className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", tone)}>
      {SHOW_OPERATIONAL_STATE_LABELS[state]}
    </span>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
          highlight ? "text-red-300" : "text-white",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function OpsShowCard({ show }: { show: OpsShowMetrics }) {
  const onTrack =
    show.performance.atRiskCount +
    show.performance.pastPromiseCount +
    show.performance.openExceptions;

  return (
    <article className="rounded-2xl border border-white/10 bg-[#10141c] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{show.artistName}</p>
          <p className="text-sm text-zinc-400">{show.tourName ?? "Show"}</p>
          <p className="text-sm text-zinc-500">{show.venueCity}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <HealthBadge health={show.health} />
          <StateBadge state={show.operationalState} />
        </div>
      </div>

      <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
        {show.timingLabel}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Orders</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{show.orderCount}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Units</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{show.unitCount}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-[0.1em] text-zinc-500 sm:grid-cols-6">
        {(
          [
            ["Production", show.pipeline.production],
            ["Packed", show.pipeline.packed],
            ["Shipped", show.pipeline.shipped],
            ["Delivered", show.pipeline.delivered],
            ["Received", show.pipeline.received],
            ["Exception", show.pipeline.exception],
          ] as const
        ).map(([label, count]) => (
          <div key={label} className="rounded-lg bg-white/[0.03] px-2 py-2">
            <p>{label}</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-white">{count}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300">
          Production
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Units waiting</p>
            <p className="mt-1 font-semibold tabular-nums text-white">
              {show.productionUnitsWaiting}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">At risk</p>
            <p className="mt-1 font-semibold tabular-nums text-amber-200">
              {show.productionUnitsAtRisk}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
          Pack + handoff
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Ready to pack</p>
            <p className="mt-1 font-semibold tabular-nums text-white">{show.packingReadyToPack}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Ready for handoff</p>
            <p className="mt-1 font-semibold tabular-nums text-violet-200">
              {show.packingReadyForHandoff}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Must leave</p>
            <p className="mt-1 font-semibold tabular-nums text-amber-200">
              {show.packingMustLeaveNext}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300">
          Next-day promise
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-[10px] uppercase text-zinc-500">On track</p>
            <p className="mt-1 font-semibold tabular-nums text-emerald-300">
              {Math.max(
                0,
                show.ordersInMotion -
                  show.performance.atRiskCount -
                  show.performance.pastPromiseCount,
              )}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">At risk</p>
            <p className="mt-1 font-semibold tabular-nums text-amber-200">
              {show.performance.atRiskCount}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Need attention</p>
            <p className="mt-1 font-semibold tabular-nums text-red-300">{onTrack}</p>
          </div>
        </div>
      </div>

      <Link
        href={opsShowHref(show.eventId)}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 hover:text-sky-200"
      >
        View show
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </article>
  );
}

function AttentionRow({ item }: { item: OpsAttentionItem }) {
  return <OpsAttentionExceptionLink item={item} />;
}

export function OpsCommandCenter({
  snapshot,
  filter,
}: {
  snapshot: OpsCommandCenterSnapshot;
  filter: string;
}) {
  const filters = [
    { id: "all", label: "All relevant" },
    { id: "live", label: "Live" },
    { id: "fulfilling", label: "Fulfilling" },
    { id: "at_risk", label: "At risk" },
    { id: "complete", label: "Complete" },
  ];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400">
          Rolling GA Ops
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Tonight&apos;s operations</h1>
        <p className="text-lg text-zinc-400">Are tonight&apos;s shows under control?</p>
        <p className="text-xs text-zinc-600">
          Updated {formatDateTime(snapshot.generatedAt)} · demo clock
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Metric label="Active shows" value={String(snapshot.global.activeShows)} />
        <Metric label="Orders in motion" value={String(snapshot.global.ordersInFulfillment)} />
        <Metric label="Delivered" value={String(snapshot.global.delivered)} />
        <Metric label="At risk" value={String(snapshot.global.atRisk)} highlight />
        <Metric label="Past promise" value={String(snapshot.global.pastPromise)} highlight />
        <Metric label="Open exceptions" value={String(snapshot.global.openExceptions)} highlight />
        <Metric
          label="Needs attention"
          value={String(snapshot.global.needsAttention)}
          highlight
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Needs attention
          </h2>
          <p className="text-xs text-zinc-600">{snapshot.attention.length} prioritized</p>
        </div>
        {snapshot.attention.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-zinc-500">
            No orders need immediate attention.
          </div>
        ) : (
          <div className="space-y-3">
            {snapshot.attention.map((item) => (
              <AttentionRow key={item.orderId} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <Link
              key={f.id}
              href={f.id === "all" ? "/ops" : `/ops?filter=${f.id}`}
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

        {snapshot.shows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 py-16 text-center">
            <p className="font-medium">No operationally relevant shows</p>
            <p className="mt-1 text-sm text-zinc-500">
              Shows appear when they are live, fulfilling, or recently ended with orders in motion.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {snapshot.shows.map((show) => (
              <OpsShowCard key={show.eventId} show={show} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

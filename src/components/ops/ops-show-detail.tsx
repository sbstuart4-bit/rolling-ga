import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { formatDateTime, formatPercent } from "@/lib/format";
import { DELIVERY_PROMISE_STATE_LABELS } from "@/lib/fulfillment";
import {
  SHOW_OPERATIONAL_HEALTH_LABELS,
  SHOW_OPERATIONAL_STATE_LABELS,
  opsExceptionsHref,
  opsOrderHref,
  type OpsAttentionItem,
  type OpsShowMetrics,
} from "@/lib/ops";
import { OpsAttentionExceptionLink } from "@/components/ops/ops-exceptions-workbench";
import { FULFILLMENT_EXCEPTION_LABELS } from "@/lib/types";
import { opsPackingHref } from "@/lib/packing";
import { opsProductionHref } from "@/lib/production";
import { FULFILLMENT_STATUS_LABELS } from "@/lib/types";
import type { FulfillmentOrderRow } from "@/server/studio/fulfillment-queries";
import { cn } from "@/lib/utils";

function HealthBanner({ show }: { show: OpsShowMetrics }) {
  const tone =
    show.health === "on_track"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : show.health === "watch"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
        : "border-red-500/30 bg-red-500/10 text-red-100";

  return (
    <div className={cn("rounded-2xl border px-5 py-4", tone)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">Operational health</p>
      <p className="mt-1 text-2xl font-semibold">{SHOW_OPERATIONAL_HEALTH_LABELS[show.health]}</p>
      <p className="mt-2 text-sm opacity-90">
        {show.health === "on_track"
          ? "No past-promise orders or open exceptions in this show."
          : show.health === "watch"
            ? "At-risk orders exist — monitor promise deadlines."
            : "Past-promise orders or open exceptions require operator review."}
      </p>
    </div>
  );
}

function OrderRow({ order }: { order: FulfillmentOrderRow }) {
  const urgent =
    order.promiseState === "past_promise" ||
    order.promiseState === "at_risk" ||
    order.hasOpenException;

  return (
    <Link
      href={opsOrderHref(order.orderId)}
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-4 transition-colors hover:border-sky-500/30 sm:flex-row sm:items-center sm:justify-between",
        urgent ? "border-amber-500/20 bg-amber-500/5" : "border-white/10 bg-white/[0.02]",
      )}
    >
      <div>
        <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
        <p className="text-sm text-zinc-400">{order.fanName}</p>
      </div>
      <div className="text-sm text-zinc-500 sm:text-right">
        <p>{FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus!]}</p>
        <p className="mt-1">{DELIVERY_PROMISE_STATE_LABELS[order.promiseState]}</p>
      </div>
    </Link>
  );
}

export function OpsShowDetail({
  show,
  orders,
  attention,
  exceptionSummary,
}: {
  show: OpsShowMetrics;
  orders: FulfillmentOrderRow[];
  attention: OpsAttentionItem[];
  exceptionSummary?: {
    open: number;
    pastPromise: number;
    byType: Record<string, number>;
  };
}) {
  const withinPromise = Math.max(
    0,
    show.ordersInMotion - show.performance.atRiskCount - show.performance.pastPromiseCount,
  );

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <Link href="/ops" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300">
          <ArrowLeft className="size-4" aria-hidden />
          Command center
        </Link>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">
            Show operations
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Is this show under control?</h1>
          <p className="mt-2 text-xl text-zinc-300">{show.artistName}</p>
          <p className="text-zinc-400">{show.tourName} · {show.venueCity}</p>
          <p className="mt-2 text-sm text-zinc-500">
            {SHOW_OPERATIONAL_STATE_LABELS[show.operationalState]} · {show.timingLabel}
          </p>
        </div>
      </header>

      <HealthBanner show={show} />

      {exceptionSummary && exceptionSummary.open > 0 ? (
        <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-red-200">
            Exceptions
          </h2>
          <p className="mt-2 text-lg text-white">
            {exceptionSummary.open} open
            {exceptionSummary.pastPromise > 0 ? ` · ${exceptionSummary.pastPromise} past promise` : ""}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-zinc-400">
            {Object.entries(exceptionSummary.byType).map(([type, count]) => (
              <li key={type}>
                {count} {FULFILLMENT_EXCEPTION_LABELS[type as keyof typeof FULFILLMENT_EXCEPTION_LABELS] ?? type}
              </li>
            ))}
          </ul>
          <Link
            href={opsExceptionsHref("open", show.eventId)}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-300 hover:text-sky-200"
          >
            View exceptions →
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      ) : null}

      {show.productionUnitsWaiting > 0 ? (
        <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-300">
            Production
          </h2>
          <p className="mt-2 text-lg text-white">
            {show.productionUnitsWaiting} units remaining
            {show.productionUnitsAtRisk > 0 ? ` · ${show.productionUnitsAtRisk} at risk` : ""}
            {show.productionOrdersBlocked > 0
              ? ` · ${show.productionOrdersBlocked} orders blocked`
              : ""}
          </p>
          <Link
            href={opsProductionHref("all", show.eventId)}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-300 hover:text-sky-200"
          >
            View production queue
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      ) : null}

      {show.packingMustLeaveNext > 0 || show.packingReadyToPack > 0 ? (
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-300">
            Pack + handoff
          </h2>
          <p className="mt-2 text-lg text-white">
            {show.packingReadyToPack} ready to pack · {show.packingReadyForHandoff} ready for
            handoff · {show.packingMustLeaveNext} must leave next
          </p>
          <Link
            href={opsPackingHref("all", show.eventId)}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-300 hover:text-sky-200"
          >
            View pack queue
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total orders", show.orderCount],
          ["Total units", show.unitCount],
          ["In motion", show.ordersInMotion],
          ["At risk", show.performance.atRiskCount],
          ["Past promise", show.performance.pastPromiseCount],
          ["Open exceptions", show.performance.openExceptions],
          [
            "Promise rate",
            show.performance.deliveryPromiseRate != null
              ? formatPercent(show.performance.deliveryPromiseRate)
              : "—",
          ],
          ["Needs attention", show.needsAttentionCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Current pipeline
        </h2>
        <p className="text-xs text-zinc-600">Where orders are now — not cumulative throughput.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              ["Received", show.pipeline.received],
              ["Production", show.pipeline.production],
              ["Packed", show.pipeline.packed],
              ["Shipped", show.pipeline.shipped],
              ["Delivered", show.pipeline.delivered],
              ["Exception", show.pipeline.exception],
            ] as const
          ).map(([label, count]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-[#10141c] p-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{count}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-sky-300">
          Next-day promise
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-[10px] uppercase text-zinc-500">Within promise</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">{withinPromise}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-[10px] uppercase text-zinc-500">At risk</p>
            <p className="mt-2 text-2xl font-semibold text-amber-200">
              {show.performance.atRiskCount}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-[10px] uppercase text-zinc-500">Past promise</p>
            <p className="mt-2 text-2xl font-semibold text-red-300">
              {show.performance.pastPromiseCount}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-[10px] uppercase text-zinc-500">Delivered within promise</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {show.performance.deliveredWithinPromise}
            </p>
          </div>
        </div>
        {show.nextPromiseDeadline ? (
          <p className="text-sm text-zinc-500">
            Next promise deadline: {formatDateTime(show.nextPromiseDeadline)}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Needs attention
        </h2>
        {attention.length === 0 ? (
          <p className="text-sm text-zinc-500">No prioritized orders for this show.</p>
        ) : (
          <div className="space-y-3">
            {attention.map((item) => (
              <OpsAttentionExceptionLink key={item.orderId} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">Orders</h2>
        <div className="space-y-2">
          {orders.slice(0, 20).map((order) => (
            <OrderRow key={order.orderId} order={order} />
          ))}
        </div>
      </section>
    </div>
  );
}

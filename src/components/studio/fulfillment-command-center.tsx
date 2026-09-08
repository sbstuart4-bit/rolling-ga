"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { formatDateTime, formatMoney, formatPercent } from "@/lib/format";
import { DELIVERY_PROMISE_STATE_LABELS, fulfillmentHref } from "@/lib/fulfillment";
import { pilotReportHref } from "@/lib/pilot-report/goals";
import {
  FULFILLMENT_EXCEPTION_LABELS,
  FULFILLMENT_PIPELINE_ORDER,
  FULFILLMENT_STATUS_LABELS,
} from "@/lib/types";
import type { ShowFulfillmentSnapshot } from "@/server/studio/fulfillment-queries";
import { cn } from "@/lib/utils";
import { EventFulfillmentPicker } from "@/components/studio/event-fulfillment-picker";

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "warning" | "success" | "danger";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
          accent === "warning" && "text-amber-600 dark:text-amber-300",
          accent === "success" && "text-emerald-600 dark:text-emerald-300",
          accent === "danger" && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PromiseBadge({ state }: { state: ShowFulfillmentSnapshot["orders"][number]["promiseState"] }) {
  const tone =
    state === "delivered_within_promise" || state === "within_promise"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : state === "at_risk"
        ? "bg-amber-500/10 text-amber-800 dark:text-amber-200"
        : state === "past_promise" || state === "delivered_past_promise"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground";

  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase", tone)}>
      {DELIVERY_PROMISE_STATE_LABELS[state]}
    </span>
  );
}

function OriginBadge({
  moment,
  activationDropTitle,
}: {
  moment: ShowFulfillmentSnapshot["orders"][number]["commerceMoment"];
  activationDropTitle: string | null;
}) {
  if (activationDropTitle) {
    return (
      <span className="text-[10px] font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300">
        Activation · {activationDropTitle}
      </span>
    );
  }
  if (moment === "show_night") {
    return (
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Show night
      </span>
    );
  }
  if (moment === "post_show") {
    return (
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Post-show
      </span>
    );
  }
  return null;
}

export function FulfillmentCommandCenter({
  snapshot,
  events,
  guidedQuery,
}: {
  snapshot: ShowFulfillmentSnapshot;
  events: { id: string; venueCity: string; startsAt: Date; timezone: string }[];
  guidedQuery?: string;
}) {
  const { pipeline, performance, orders, openExceptions } = snapshot;
  const ordersHref = (orderId: string) =>
    `/studio/orders/${orderId}${guidedQuery ? `?${guidedQuery}` : ""}`;

  const promiseRateLabel =
    performance.deliveryPromiseRate != null
      ? formatPercent(performance.deliveryPromiseRate)
      : "—";

  return (
    <div className="space-y-10">
      {snapshot.isDemoData ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Demo operational data — fulfillment events are seeded for the Brooklyn walkthrough, not
          live carrier tracking.
        </div>
      ) : null}

      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Orders & fulfillment
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {snapshot.artistName} · {snapshot.eventLabel}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Are tonight&apos;s orders under control?
            </p>
          </div>
          {events.length > 1 ? (
            <EventFulfillmentPicker events={events} currentEventId={snapshot.eventId} />
          ) : null}
        </div>
        <Link
          href={pilotReportHref(snapshot.eventId)}
          className="inline-flex text-xs font-semibold uppercase tracking-[0.12em] text-violet-400 hover:text-violet-300"
        >
          View pilot report →
        </Link>
      </header>

      {openExceptions.length > 0 ? (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <p className="text-sm font-semibold text-destructive">
            {openExceptions.length} order{openExceptions.length === 1 ? "" : "s"} need attention
          </p>
          <ul className="mt-3 space-y-2">
            {openExceptions.map((ex) => (
              <li key={ex.id}>
                <Link
                  href={ordersHref(ex.orderId)}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-card px-3 py-2 text-sm hover:bg-muted/40"
                >
                  <span className="font-mono text-xs">{ex.orderNumber}</span>
                  <span className="text-muted-foreground">
                    {FULFILLMENT_EXCEPTION_LABELS[ex.type as keyof typeof FULFILLMENT_EXCEPTION_LABELS] ??
                      ex.type}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total fulfillment orders" value={String(pipeline.total)} />
        <MetricCard
          label="Delivered within promise"
          value={String(performance.deliveredWithinPromise)}
          accent="success"
        />
        <MetricCard
          label="Delivery promise rate"
          value={promiseRateLabel}
          accent="success"
        />
        <MetricCard
          label="Exceptions"
          value={String(performance.openExceptions)}
          accent={performance.openExceptions > 0 ? "danger" : undefined}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Current pipeline
          </h2>
          <p className="text-xs text-muted-foreground">Current state — where orders are now</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {FULFILLMENT_PIPELINE_ORDER.map((stage) => (
            <div
              key={stage}
              className="rounded-xl border border-border bg-card p-4 text-center"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {FULFILLMENT_STATUS_LABELS[stage]}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{pipeline[stage]}</p>
            </div>
          ))}
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-destructive">
              Exception
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-destructive">
              {pipeline.exception}
            </p>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{pipeline.total}</span> orders
          in fulfillment
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Delivery performance
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Delivered" value={String(performance.deliveredCount)} />
          <MetricCard
            label="Delivered within promise"
            value={String(performance.deliveredWithinPromise)}
            accent="success"
          />
          <MetricCard
            label="Delivered after promise"
            value={String(performance.deliveredPastPromise)}
            accent={performance.deliveredPastPromise > 0 ? "warning" : undefined}
          />
          <MetricCard label="At risk (undelivered)" value={String(performance.atRiskCount)} accent="warning" />
          <MetricCard
            label="Past promise (undelivered)"
            value={String(performance.pastPromiseCount)}
            accent={performance.pastPromiseCount > 0 ? "danger" : undefined}
          />
          <MetricCard
            label="Open exceptions"
            value={String(performance.openExceptions)}
            accent={performance.openExceptions > 0 ? "danger" : undefined}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Delivery promise rate = delivered within promise ÷ delivered orders eligible for measurement.
          Show-night orders are promised by 6:00 PM local the day after the show. Post-show and
          activation orders use the estimated delivery window.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Orders
        </h2>
        <div className="space-y-2">
          {orders.map((order) => (
            <Link
              key={order.orderId}
              href={ordersHref(order.orderId)}
              className="block rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs">{order.orderNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus!]}
                    </span>
                    {order.hasOpenException ? (
                      <span className="text-[10px] font-semibold uppercase text-destructive">
                        Needs attention
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium">{order.fanName}</p>
                  <OriginBadge
                    moment={order.commerceMoment}
                    activationDropTitle={order.activationDropTitle}
                  />
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatMoney(order.totalCents)}</p>
                  <PromiseBadge state={order.promiseState} />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                {order.placedAt ? (
                  <span>Ordered {formatDateTime(order.placedAt)}</span>
                ) : null}
                {order.promisedDeliveryAt ? (
                  <span>Promise {formatDateTime(order.promisedDeliveryAt)}</span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

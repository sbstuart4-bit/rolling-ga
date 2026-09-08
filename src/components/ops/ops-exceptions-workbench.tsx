import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import {
  opsExceptionHref,
  opsExceptionsHref,
  opsOrderHref,
  type OpsAttentionItem,
} from "@/lib/ops";
import { DELIVERY_PROMISE_STATE_LABELS } from "@/lib/fulfillment";
import {
  FULFILLMENT_EXCEPTION_LABELS,
  FULFILLMENT_EXCEPTION_STATUS_LABELS,
} from "@/lib/types";
import type { ExceptionsQueueSnapshot } from "@/lib/exceptions";
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

function ExceptionCard({
  item,
}: {
  item: ExceptionsQueueSnapshot["filtered"][number];
}) {
  const urgent =
    item.promiseState === "past_promise" ||
    item.type === "delivery_failed" ||
    item.priority <= 3;

  return (
    <Link
      href={opsExceptionHref(item.id)}
      className={cn(
        "block rounded-xl border p-5 transition-colors hover:border-sky-500/30",
        urgent ? "border-amber-500/20 bg-amber-500/5" : "border-white/10 bg-[#10141c]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold">{item.orderNumber}</p>
          <p className="text-sm text-zinc-400">{item.artistName} · {item.showLabel}</p>
          <p className="mt-2 text-sm font-medium text-amber-200">
            {FULFILLMENT_EXCEPTION_LABELS[item.type]}
          </p>
        </div>
        <div className="text-right">
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-zinc-400">
            {FULFILLMENT_EXCEPTION_STATUS_LABELS[item.status]}
          </span>
          <p className="mt-2 text-[10px] font-semibold uppercase text-red-200/90">
            {item.priorityLabel}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span className="capitalize">{item.operationalStage.replace(/_/g, " ")}</span>
        {item.promisedDeliveryAt ? <span>Promise {formatDateTime(item.promisedDeliveryAt)}</span> : null}
        <span>{DELIVERY_PROMISE_STATE_LABELS[item.promiseState]}</span>
        <span>Open {item.ageMinutes} min</span>
      </div>
      <p className="mt-3 text-sm text-sky-300">Resolve →</p>
    </Link>
  );
}

export function OpsExceptionsWorkbench({
  snapshot,
  filter,
  eventId,
}: {
  snapshot: ExceptionsQueueSnapshot;
  filter: string;
  eventId?: string;
}) {
  const filters = [
    { id: "open", label: "Open" },
    { id: "in_progress", label: "In progress" },
    { id: "past_promise", label: "Past promise" },
    { id: "at_risk", label: "At risk" },
    { id: "resolved", label: "Resolved today" },
    { id: "all", label: "All active" },
  ];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400">
          Rolling GA Ops
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Exception resolution</h1>
        <p className="text-lg text-zinc-400">What needs attention first?</p>
        <p className="text-xs text-zinc-600">Updated {formatDateTime(snapshot.generatedAt)}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Open" value={String(snapshot.summary.open)} highlight />
        <Metric label="In progress" value={String(snapshot.summary.inProgress)} />
        <Metric label="Past promise" value={String(snapshot.summary.pastPromise)} highlight />
        <Metric label="At risk" value={String(snapshot.summary.atRisk)} highlight />
        <Metric label="Resolved today" value={String(snapshot.summary.resolvedToday)} />
      </section>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.id}
            href={opsExceptionsHref(f.id, eventId)}
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

      {snapshot.filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center">
          <p className="font-semibold">No exceptions in this view</p>
          <p className="mt-1 text-sm text-zinc-500">Try another filter or check back after new issues are logged.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {snapshot.filtered.map((item) => (
            <li key={item.id}>
              <ExceptionCard item={item} />
            </li>
          ))}
        </ul>
      )}

      {filter !== "resolved" && snapshot.recentlyResolved.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Recently resolved
          </h2>
          <ul className="space-y-3">
            {snapshot.recentlyResolved.slice(0, 5).map((item) => (
              <li key={item.id}>
                <Link
                  href={opsExceptionHref(item.id)}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 hover:border-sky-500/30"
                >
                  <div>
                    <p className="font-mono text-sm">{item.orderNumber}</p>
                    <p className="text-xs text-zinc-500">
                      {FULFILLMENT_EXCEPTION_LABELS[item.type]}
                      {item.resolvedAt ? ` · ${formatDateTime(item.resolvedAt)}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-300">View history →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function OpsAttentionExceptionLink({ item }: { item: OpsAttentionItem }) {
  const href = item.exceptionId ? opsExceptionHref(item.exceptionId) : opsOrderHref(item.orderId);
  const label = item.exceptionId ? "Resolve →" : "View →";

  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-xl border border-white/10 bg-[#10141c] p-4 transition-colors hover:border-sky-500/30 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="font-mono text-sm font-semibold">{item.orderNumber}</p>
        <p className="text-sm text-zinc-400">
          {item.artistName} · {item.showLabel}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-200">
          {item.reasonLabel}
        </p>
      </div>
      <div className="text-sm text-zinc-500 sm:text-right">
        {item.promisedDeliveryAt ? (
          <p>Promise: {formatDateTime(item.promisedDeliveryAt)}</p>
        ) : null}
        <p className="mt-2 text-sky-300">{label}</p>
      </div>
    </Link>
  );
}

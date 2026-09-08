import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { DELIVERY_PROMISE_STATE_LABELS } from "@/lib/fulfillment";
import {
  opsExceptionHref,
  opsExceptionsHref,
  opsOrderHref,
  opsShowHref,
} from "@/lib/ops";
import {
  EXCEPTION_ACTION_LABELS,
  FULFILLMENT_EXCEPTION_LABELS,
  FULFILLMENT_EXCEPTION_STATUS_LABELS,
  FULFILLMENT_STATUS_LABELS,
} from "@/lib/types";
import type { ExceptionWorkbenchSnapshot } from "@/lib/exceptions";
import { ExceptionWorkbenchActions } from "@/components/ops/exception-workbench-actions";
import { cn } from "@/lib/utils";

function PriorityBadge({ label, urgent }: { label: string; urgent: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase",
        urgent ? "bg-red-500/15 text-red-200" : "bg-amber-500/15 text-amber-200",
      )}
    >
      {label}
    </span>
  );
}

export function OpsExceptionDetail({ snapshot }: { snapshot: ExceptionWorkbenchSnapshot }) {
  const { exception } = snapshot;
  const urgent =
    exception.promiseState === "past_promise" ||
    exception.promiseState === "at_risk" ||
    exception.type === "delivery_failed";
  const isResolved = exception.status === "resolved";

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <Link
          href={opsExceptionsHref()}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Exceptions
        </Link>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400">
            Exception resolution workbench
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {FULFILLMENT_EXCEPTION_LABELS[exception.type]}
          </h1>
          <p className="mt-2 text-lg text-zinc-400">
            What needs to happen next to protect the fan promise?
          </p>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#10141c] p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">Status</p>
              <p className="mt-1 text-xl font-semibold">
                {FULFILLMENT_EXCEPTION_STATUS_LABELS[exception.status]}
              </p>
            </div>
            <PriorityBadge label={exception.priorityLabel} urgent={urgent} />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase text-zinc-500">Order</p>
              <Link href={opsOrderHref(exception.orderId)} className="mt-1 font-mono font-semibold text-sky-300 hover:text-sky-200">
                {exception.orderNumber}
              </Link>
            </div>
            <div>
              <p className="text-[10px] uppercase text-zinc-500">Show</p>
              {exception.eventId ? (
                <Link href={opsShowHref(exception.eventId)} className="mt-1 block text-sm text-zinc-300 hover:text-white">
                  {exception.artistName} · {exception.showLabel}
                </Link>
              ) : (
                <p className="mt-1 text-sm text-zinc-300">{exception.artistName}</p>
              )}
            </div>
            {exception.productSummary ? (
              <div className="sm:col-span-2">
                <p className="text-[10px] uppercase text-zinc-500">Product</p>
                <p className="mt-1 text-sm text-zinc-300">{exception.productSummary}</p>
              </div>
            ) : null}
            <div>
              <p className="text-[10px] uppercase text-zinc-500">Operational stage</p>
              <p className="mt-1 text-sm font-medium capitalize text-zinc-200">
                {exception.operationalStage.replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-zinc-500">Age</p>
              <p className="mt-1 text-sm text-zinc-300">{exception.ageMinutes} min</p>
            </div>
          </div>
          {exception.note ? (
            <p className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm text-zinc-400">
              {exception.note}
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">
              Promise / risk
            </p>
            <p className="mt-2 text-lg font-semibold">
              {exception.promisedDeliveryAt ? formatDateTime(exception.promisedDeliveryAt) : "—"}
            </p>
            <p className="mt-2 text-sm text-amber-100">
              {DELIVERY_PROMISE_STATE_LABELS[exception.promiseState]}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#10141c] p-5 text-sm text-zinc-400">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              After resolution
            </p>
            <p className="mt-2">{snapshot.returnToFlowLabel}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10141c] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Current operational state
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Fulfillment</p>
            <p className="mt-1 font-medium">
              {snapshot.fulfillmentStatus
                ? FULFILLMENT_STATUS_LABELS[snapshot.fulfillmentStatus]
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Production</p>
            <p className="mt-1 font-medium">
              {snapshot.productionComplete ? "Complete" : "Incomplete"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Packing</p>
            <p className="mt-1 font-medium capitalize">
              {snapshot.packingState?.replace(/_/g, " ") ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-zinc-500">Handoff ready</p>
            <p className="mt-1 font-medium">{snapshot.handoffReady ? "Yes" : "No"}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#10141c] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Available actions
        </h2>
        <div className="mt-4">
          <ExceptionWorkbenchActions
            exceptionId={exception.id}
            availableActions={snapshot.availableActions}
            isResolved={isResolved}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Action history
        </h2>
        <ul className="space-y-3">
          {snapshot.actions.map((action) => (
            <li
              key={action.id}
              className="rounded-xl border border-white/10 bg-[#10141c] px-4 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-white">
                  {EXCEPTION_ACTION_LABELS[action.actionType]}
                </p>
                <p className="text-xs text-zinc-500">{formatDateTime(action.createdAt)}</p>
              </div>
              {action.actorName !== "System" ? (
                <p className="mt-1 text-xs text-zinc-400">{action.actorName}</p>
              ) : null}
              {action.note ? <p className="mt-2 text-sm text-zinc-400">{action.note}</p> : null}
            </li>
          ))}
        </ul>
        {isResolved && exception.resolvedAt ? (
          <p className="text-sm text-emerald-300">
            Resolved {formatDateTime(exception.resolvedAt)}
          </p>
        ) : null}
      </section>
    </div>
  );
}

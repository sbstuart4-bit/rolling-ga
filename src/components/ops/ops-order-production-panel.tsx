import type { OrderProductionStatus } from "@/lib/production";
import { PRODUCTION_WORK_STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function OpsOrderProductionPanel({ status }: { status: OrderProductionStatus }) {
  if (status.orderProductionState === "not_applicable") {
    return null;
  }

  const stateLabel =
    status.orderProductionState === "ready_to_pack"
      ? "Ready to pack"
      : status.orderProductionState === "in_progress"
        ? "In progress"
        : "Waiting";

  const stateTone =
    status.orderProductionState === "ready_to_pack"
      ? "text-emerald-300"
      : status.orderProductionState === "in_progress"
        ? "text-sky-300"
        : "text-amber-200";

  return (
    <section className="mb-8 space-y-4 rounded-2xl border border-white/10 bg-[#10141c] p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Production
        </h2>
        <p className={cn("text-sm font-semibold uppercase tracking-[0.12em]", stateTone)}>
          Order production: {stateLabel}
        </p>
      </div>

      <ul className="space-y-3">
        {status.lines
          .filter((line) => line.requiredUnits > 0)
          .map((line) => (
            <li
              key={line.orderItemId}
              className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{line.productName}</p>
                {line.size ? <p className="text-sm text-zinc-500">Size {line.size}</p> : null}
              </div>
              <p className="text-sm tabular-nums text-zinc-300">
                {line.completeUnits} / {line.requiredUnits} complete
                {line.inProductionUnits > 0
                  ? ` · ${line.inProductionUnits} ${PRODUCTION_WORK_STATUS_LABELS.in_production.toLowerCase()}`
                  : ""}
                {line.queuedUnits > 0 ? ` · ${line.queuedUnits} queued` : ""}
              </p>
            </li>
          ))}
      </ul>

      {status.readyToPack ? (
        <p className="text-sm text-emerald-200">
          All required production is complete — this order is ready to pack (Ops Phase 3).
        </p>
      ) : null}
    </section>
  );
}

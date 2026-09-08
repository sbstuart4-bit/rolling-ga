"use client";

import { useTransition } from "react";
import { completeProductionAction, startProductionAction } from "@/server/ops/production-actions";

export function ProductionGroupActions({
  workIds,
  canStart,
  canComplete,
}: {
  workIds: string[];
  canStart: boolean;
  canComplete: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {canStart ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await startProductionAction(workIds);
            })
          }
          className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-sky-400 disabled:opacity-50"
        >
          Start production
        </button>
      ) : null}
      {canComplete ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await completeProductionAction(workIds);
            })
          }
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
        >
          Mark complete
        </button>
      ) : null}
    </div>
  );
}

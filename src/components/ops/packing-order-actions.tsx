"use client";

import { useTransition } from "react";
import {
  markHandedToCarrierAction,
  markPackedAction,
  startPackingAction,
} from "@/server/ops/packing-actions";
import type { PackOperationalState } from "@/lib/packing";

export function PackingOrderActions({
  orderId,
  operationalState,
}: {
  orderId: string;
  operationalState: PackOperationalState;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {operationalState === "ready_to_pack" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await startPackingAction(orderId);
            })
          }
          className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-sky-400 disabled:opacity-50"
        >
          Start packing
        </button>
      ) : null}
      {operationalState === "packing" || operationalState === "ready_to_pack" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markPackedAction(orderId);
            })
          }
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
        >
          Mark packed
        </button>
      ) : null}
      {operationalState === "ready_for_handoff" || operationalState === "packed" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await markHandedToCarrierAction(orderId);
            })
          }
          className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-violet-200 hover:bg-violet-500/20 disabled:opacity-50"
        >
          Hand to carrier
        </button>
      ) : null}
    </div>
  );
}

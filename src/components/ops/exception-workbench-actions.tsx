"use client";

import { useState, useTransition } from "react";
import {
  EXCEPTION_ACTION_LABELS,
  type ExceptionActionType,
} from "@/lib/types";
import { performExceptionAction, resolveExceptionAction } from "@/server/ops/exception-actions";
import { cn } from "@/lib/utils";

export function ExceptionWorkbenchActions({
  exceptionId,
  availableActions,
  isResolved,
}: {
  exceptionId: string;
  availableActions: ExceptionActionType[];
  isResolved: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isResolved) {
    return (
      <p className="text-sm text-emerald-300">This exception is resolved. History is preserved below.</p>
    );
  }

  const operationalActions = availableActions.filter(
    (a) => a !== "add_note" && a !== "resolve",
  );

  function runAction(actionType: ExceptionActionType, actionNote?: string) {
    setError(null);
    startTransition(async () => {
      const result = await performExceptionAction(exceptionId, actionType, actionNote);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (actionType === "add_note") setNote("");
    });
  }

  function runResolve() {
    setError(null);
    startTransition(async () => {
      const result = await resolveExceptionAction(exceptionId, resolutionNote);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setResolutionNote("");
    });
  }

  return (
    <div className="space-y-6">
      {operationalActions.length > 0 ? (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            Operational actions
          </p>
          <div className="flex flex-wrap gap-2">
            {operationalActions.map((action) => (
              <button
                key={action}
                type="button"
                disabled={pending}
                onClick={() => runAction(action, `${EXCEPTION_ACTION_LABELS[action]} recorded.`)}
                className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-sky-200 hover:bg-sky-500/20 disabled:opacity-50"
              >
                {EXCEPTION_ACTION_LABELS[action]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Add note</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Operator note — plain text"
          className="w-full rounded-xl border border-white/10 bg-[#0c0f14] px-4 py-3 text-sm text-white placeholder:text-zinc-600"
        />
        <button
          type="button"
          disabled={pending || !note.trim()}
          onClick={() => runAction("add_note", note)}
          className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white hover:bg-white/15 disabled:opacity-50"
        >
          Add note
        </button>
      </div>

      <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
          Resolve exception
        </p>
        <textarea
          value={resolutionNote}
          onChange={(e) => setResolutionNote(e.target.value)}
          rows={3}
          placeholder="What was done to clear the blocking condition?"
          className="w-full rounded-xl border border-white/10 bg-[#0c0f14] px-4 py-3 text-sm text-white placeholder:text-zinc-600"
        />
        <button
          type="button"
          disabled={pending || !resolutionNote.trim()}
          onClick={runResolve}
          className={cn(
            "rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em]",
            "bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50",
          )}
        >
          Resolve exception
        </button>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}

import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { opsExceptionHref } from "@/lib/ops";
import {
  FULFILLMENT_EXCEPTION_LABELS,
  FULFILLMENT_EXCEPTION_STATUS_LABELS,
} from "@/lib/types";

export function OpsOrderExceptionsPanel({
  exceptions,
}: {
  exceptions: {
    id: string;
    type: string;
    status: string;
    note: string | null;
    createdAt: Date;
    resolvedAt: Date | null;
  }[];
}) {
  const open = exceptions.filter((e) => e.status === "open" || e.status === "in_progress");
  const resolved = exceptions
    .filter((e) => e.status === "resolved")
    .sort((a, b) => (b.resolvedAt?.getTime() ?? 0) - (a.resolvedAt?.getTime() ?? 0))
    .slice(0, 5);

  if (open.length === 0 && resolved.length === 0) return null;

  return (
    <section className="mb-8 space-y-6">
      {open.length > 0 ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-red-200">
            Open exceptions
          </h2>
          {open.map((ex) => (
            <div key={ex.id} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-white">
                  {FULFILLMENT_EXCEPTION_LABELS[ex.type as keyof typeof FULFILLMENT_EXCEPTION_LABELS] ??
                    ex.type}
                </p>
                <p className="text-xs text-zinc-500">
                  {FULFILLMENT_EXCEPTION_STATUS_LABELS[ex.status as keyof typeof FULFILLMENT_EXCEPTION_STATUS_LABELS] ??
                    ex.status}{" "}
                  · Opened {formatDateTime(ex.createdAt)}
                </p>
                {ex.note ? <p className="mt-1 text-sm text-zinc-400">{ex.note}</p> : null}
              </div>
              <Link
                href={opsExceptionHref(ex.id)}
                className="text-sm font-medium text-sky-300 hover:text-sky-200"
              >
                View / resolve →
              </Link>
            </div>
          ))}
        </div>
      ) : null}

      {resolved.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#10141c] p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Recent resolutions
          </h2>
          {resolved.map((ex) => (
            <div key={ex.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-zinc-300">
                  {FULFILLMENT_EXCEPTION_LABELS[ex.type as keyof typeof FULFILLMENT_EXCEPTION_LABELS] ??
                    ex.type}
                </p>
                {ex.resolvedAt ? (
                  <p className="text-xs text-zinc-500">Resolved {formatDateTime(ex.resolvedAt)}</p>
                ) : null}
              </div>
              <Link href={opsExceptionHref(ex.id)} className="text-xs text-sky-300 hover:text-sky-200">
                View history →
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

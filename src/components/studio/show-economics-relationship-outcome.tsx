import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { cohortHref } from "@/lib/relationship-intelligence/cohorts";

export function ShowEconomicsRelationshipOutcome({
  eventId,
  connectedFans,
  postShowPurchasers,
  repeatPurchasers,
  postShowGmvCents,
  activatedPostShowGmvCents,
}: {
  eventId: string;
  connectedFans: number;
  postShowPurchasers: number;
  repeatPurchasers: number;
  postShowGmvCents: number;
  activatedPostShowGmvCents?: number;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-violet-300">
          Relationship outcome
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Rolling GA created immediate commerce and an ongoing measurable audience.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OutcomeMetric label="Connected fans created" value={String(connectedFans)} />
        <OutcomeMetric label="Post-show purchasers" value={String(postShowPurchasers)} />
        <OutcomeMetric label="Repeat purchasers" value={String(repeatPurchasers)} />
        <OutcomeMetric label="Post-show GMV" value={formatMoney(postShowGmvCents)} />
        {activatedPostShowGmvCents != null && activatedPostShowGmvCents > 0 ? (
          <OutcomeMetric
            label="Activated post-show GMV"
            value={formatMoney(activatedPostShowGmvCents)}
          />
        ) : null}
      </div>
      <Link
        href={cohortHref(eventId)}
        className="inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200"
      >
        View relationship cohort
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}

function OutcomeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/50 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

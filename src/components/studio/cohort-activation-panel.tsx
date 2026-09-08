import Link from "next/link";
import { Users, Zap } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { ActivationDropSummary } from "@/server/activation/queries";

export function CohortActivationCta({
  eventId,
  cohortStage,
  audienceLabel,
  eligibleCount,
}: {
  eventId: string;
  cohortStage: string;
  audienceLabel: string;
  eligibleCount: number;
}) {
  const href = `/studio/drops/new?event=${eventId}&cohort=${cohortStage}`;

  return (
    <section className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
            Activate this audience
          </p>
          <p className="text-sm text-muted-foreground">
            {audienceLabel} — {eligibleCount.toLocaleString("en-US")} eligible fan
            {eligibleCount === 1 ? "" : "s"}
          </p>
          <p className="text-sm">
            Turn this relationship cohort into a timed drop without exporting a list.
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-violet-500"
        >
          <Zap className="size-4" aria-hidden />
          Create drop for this audience
        </Link>
      </div>
    </section>
  );
}

export function CohortActivationHistory({
  activations,
}: {
  activations: ActivationDropSummary[];
}) {
  if (activations.length === 0) return null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Activation history
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Audience activations published from this show cohort.
        </p>
      </div>
      <ul className="space-y-3">
        {activations.map((activation) => (
          <li
            key={activation.dropId}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{activation.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Audience: {activation.audienceLabel}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Users className="size-3.5" aria-hidden />
                  Eligible {activation.eligibleFans} · Purchasers {activation.purchasingFans}
                  {activation.isLive ? (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-success">Live</span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5">Ended</span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Activated revenue
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatMoney(activation.activatedRevenueCents)}
                </p>
                <Link
                  href={`/studio/drops/${activation.dropId}`}
                  className="mt-2 inline-block text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-300"
                >
                  View results →
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

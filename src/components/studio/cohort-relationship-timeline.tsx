import { formatMoney } from "@/lib/format";
import type { CohortTimelinePhase } from "@/lib/relationship-intelligence/types";

export function CohortRelationshipTimeline({ phases }: { phases: CohortTimelinePhase[] }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Relationship timeline
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          How this show cohort developed over time — observed activity only.
        </p>
      </div>
      <ol className="space-y-3">
        {phases.map((phase) => (
          <li
            key={phase.key}
            className="rounded-xl border border-border bg-card p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
                {phase.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{phase.description}</p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:mt-0 sm:text-right">
              <div>
                <dt className="text-xs text-muted-foreground">Purchasers</dt>
                <dd className="font-semibold tabular-nums">{phase.purchasers}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">GMV</dt>
                <dd className="font-semibold tabular-nums">{formatMoney(phase.gmvCents)}</dd>
              </div>
              {phase.repeatPurchasers > 0 ? (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Repeat purchasers</dt>
                  <dd className="font-semibold tabular-nums">{phase.repeatPurchasers}</dd>
                </div>
              ) : null}
            </dl>
          </li>
        ))}
      </ol>
    </section>
  );
}

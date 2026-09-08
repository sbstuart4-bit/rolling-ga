import Link from "next/link";
import { formatEventDate, formatMoney, initialsOf } from "@/lib/format";
import { cohortStageLabel, type CohortFunnelStage } from "@/lib/relationship-intelligence/types";
import type { CohortFanRow } from "@/lib/relationship-intelligence/types";

export function CohortFanList({
  eventId,
  fans,
  activeStage,
}: {
  eventId: string;
  fans: CohortFanRow[];
  activeStage: CohortFunnelStage | null;
}) {
  const title = activeStage ? cohortStageLabel(activeStage) : "Connected fans";

  if (fans.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border py-12 text-center">
        <p className="font-medium">No fans in this stage</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try another funnel stage or check back as the show cohort grows.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {fans.length} fan{fans.length === 1 ? "" : "s"} — open a profile for the full timeline.
          </p>
        </div>
        {activeStage ? (
          <Link
            href={`/studio/fans/cohort/${eventId}`}
            className="text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-300"
          >
            Clear filter
          </Link>
        ) : null}
      </div>

      <ul className="space-y-3">
        {fans.map((fan) => (
          <li key={fan.userId}>
            <Link
              href={`/studio/fans/${fan.userId}`}
              className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-violet-500/30 hover:bg-violet-500/5"
            >
              <div className="flex flex-wrap items-start gap-3">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold"
                  aria-hidden
                >
                  {initialsOf(fan.displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{fan.displayName}</p>
                  <p className="text-xs text-muted-foreground">{fan.email}</p>
                  {fan.relationshipStart ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Relationship start: {fan.relationshipStart.artistName}
                      {fan.relationshipStart.tourName ? ` · ${fan.relationshipStart.tourName}` : ""}
                      {" · "}
                      {fan.relationshipStart.venueCity}
                      {" · "}
                      {formatEventDate(
                        fan.relationshipStart.startsAt,
                        fan.relationshipStart.timezone,
                      )}
                    </p>
                  ) : null}
                </div>
                <dl className="grid w-full gap-2 text-sm sm:ml-auto sm:w-auto sm:text-right">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Observed value
                    </dt>
                    <dd className="font-semibold tabular-nums">
                      {formatMoney(fan.totalObservedGmvCents)}
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-3 sm:justify-end">
                    <span className="text-xs text-muted-foreground">
                      Show night {formatMoney(fan.showNightGmvCents)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Post-show {formatMoney(fan.postShowGmvCents)}
                    </span>
                  </div>
                </dl>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

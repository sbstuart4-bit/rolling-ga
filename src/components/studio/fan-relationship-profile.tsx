import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatEventDate, formatMoney, initialsOf } from "@/lib/format";
import {
  FanRelationshipIcon,
  ObservedValueBadge,
} from "@/components/studio/fan-relationship-ui";
import type { FanRelationshipProfile } from "@/server/studio/fan-relationship-queries";
import { cn } from "@/lib/utils";

const PHASE_LABELS = {
  show_night: "Show night",
  post_show: "Post-show",
  unattributed: "Unattributed",
} as const;

export function FanRelationshipProfileView({ profile }: { profile: FanRelationshipProfile }) {
  const { observedValue, relationshipStarted, lastActivityAt } = profile;

  return (
    <div className="space-y-8">
      {profile.isDemoData && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Demo data — this fan relationship is part of the seeded demonstration story.
        </div>
      )}

      <header className="flex flex-wrap items-start gap-4">
        <Link
          href="/studio/fans"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All fans
        </Link>
      </header>

      <div className="flex flex-wrap items-start gap-4">
        <div
          className="flex size-14 items-center justify-center rounded-full bg-muted text-lg font-semibold"
          aria-hidden
        >
          {initialsOf(profile.displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Verified fan
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{profile.displayName}</h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      {relationshipStarted ? (
        <section className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
            Relationship start
          </p>
          <p className="mt-2 text-lg font-semibold">{relationshipStarted.artistName}</p>
          {relationshipStarted.tourName ? (
            <p className="text-sm text-muted-foreground">{relationshipStarted.tourName}</p>
          ) : null}
          <p className="mt-1 text-sm">
            {relationshipStarted.venueCity} ·{" "}
            {formatEventDate(relationshipStarted.startsAt, relationshipStarted.timezone)}
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryMetric label="Shows attended" value={String(observedValue.showsAttended)} />
        <SummaryMetric label="Show-night GMV" value={formatMoney(observedValue.showNightGmvCents)} />
        <SummaryMetric label="Post-show GMV" value={formatMoney(observedValue.postShowGmvCents)} />
        <SummaryMetric
          label="Total observed fan value"
          value={formatMoney(observedValue.totalObservedGmvCents)}
          accent
        />
        <SummaryMetric
          label="Last activity"
          value={
            lastActivityAt
              ? lastActivityAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"
          }
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Timeline
        </h2>
        <ol className="relative space-y-0 border-l border-border pl-6">
          {profile.timeline.map((entry) => (
            <li key={entry.id} className="relative pb-6 last:pb-0">
              <span
                className="absolute -left-[25px] top-1 flex size-3 rounded-full border-2 border-background bg-primary"
                aria-hidden
              />
              <div className="flex flex-wrap items-start gap-3">
                <FanRelationshipIcon kind={entry.kind} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {entry.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="font-medium">{entry.label}</p>
                  {entry.detail ? (
                    <p className="text-xs text-violet-600 dark:text-violet-300">{entry.detail}</p>
                  ) : null}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {entry.amountCents != null && (
                      <ObservedValueBadge cents={entry.amountCents} />
                    )}
                    {entry.phase && entry.phase !== "unattributed" && (
                      <span className="text-xs text-muted-foreground">{PHASE_LABELS[entry.phase]}</span>
                    )}
                    {entry.phase === "unattributed" && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        Unattributed — no provable show link
                      </span>
                    )}
                    {entry.isDemo && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        Demo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Observed fan value
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Historical commerce tied to verified attendance — not a predictive LTV model.
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ValueRow label="Show-night GMV" cents={observedValue.showNightGmvCents} />
          <ValueRow label="Post-show GMV" cents={observedValue.postShowGmvCents} />
          <ValueRow
            label="Total observed GMV"
            cents={observedValue.totalObservedGmvCents}
            accent
          />
          {observedValue.unattributedGmvCents > 0 && (
            <ValueRow
              label="Unattributed GMV"
              cents={observedValue.unattributedGmvCents}
              muted
            />
          )}
          <div>
            <dt className="text-xs text-muted-foreground">Orders</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{observedValue.orderCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Shows attended</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{observedValue.showsAttended}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          accent && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ValueRow({
  label,
  cents,
  accent,
  muted,
}: {
  label: string;
  cents: number;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          accent && "text-emerald-600 dark:text-emerald-400",
          muted && "text-muted-foreground",
        )}
      >
        {formatMoney(cents)}
      </dd>
    </div>
  );
}

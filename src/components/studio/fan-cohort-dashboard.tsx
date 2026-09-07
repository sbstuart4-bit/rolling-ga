import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RelationshipFunnel } from "@/components/studio/relationship-funnel";
import { formatEventDate, formatMoney, formatPercent } from "@/lib/format";
import type { ShowCohortMetrics } from "@/server/studio/fan-relationship-queries";

function CohortMetric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

export function FanCohortDashboard({
  cohort,
  eventPicker,
}: {
  cohort: ShowCohortMetrics;
  eventPicker?: React.ReactNode;
}) {
  const { event } = cohort;

  return (
    <div className="space-y-8">
      {cohort.isDemoData && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Demo data — cohort metrics reflect seeded Brooklyn demonstration orders and post-show
          purchases.
        </div>
      )}

      <header className="space-y-4">
        <Link
          href="/studio/fans"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Fan relationships
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Show cohort value
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {event.artistName} → {event.venueCity} →{" "}
              {formatEventDate(event.startsAt, event.timezone)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              What was the {event.venueCity} audience worth after they left the building?
            </p>
          </div>
          {eventPicker}
        </div>
      </header>

      <RelationshipFunnel
        metrics={{
          attendees: cohort.originalVerifiedAttendees,
          connectedFans: cohort.connectedFans,
          purchasingFans: cohort.purchasingFans,
          repeatPurchasers: cohort.repeatPurchasers,
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CohortMetric
          label="Original verified attendees"
          value={cohort.originalVerifiedAttendees.toLocaleString("en-US")}
        />
        <CohortMetric
          label="Connected after show"
          value={cohort.connectedAfterShow.toLocaleString("en-US")}
          detail="Stay Connected granted after show end"
        />
        <CohortMetric
          label="Connected fans"
          value={cohort.connectedFans.toLocaleString("en-US")}
          detail="Opted in to artist connection"
        />
        <CohortMetric
          label="Purchasing fans"
          value={cohort.purchasingFans.toLocaleString("en-US")}
          detail="At least one show-attributed order"
        />
        <CohortMetric
          label="Repeat purchasers"
          value={cohort.repeatPurchasers.toLocaleString("en-US")}
          detail="Two or more show-attributed orders"
        />
        <CohortMetric
          label="Show-night GMV"
          value={formatMoney(cohort.showNightGmvCents)}
          detail="During set window, provably attributed"
        />
        <CohortMetric
          label="30-day post-show GMV"
          value={formatMoney(cohort.postShowGmv30DaysCents)}
        />
        <CohortMetric
          label="90-day post-show GMV"
          value={formatMoney(cohort.postShowGmv90DaysCents)}
        />
        <CohortMetric
          label="Total observed GMV"
          value={formatMoney(cohort.totalObservedGmvCents)}
          detail="Show-night + post-show, attributed only"
        />
        <CohortMetric
          label="Repeat purchase rate"
          value={
            cohort.repeatPurchaseRate != null
              ? formatPercent(cohort.repeatPurchaseRate)
              : "—"
          }
          detail="Verified fans with 2+ attributed orders"
        />
        <CohortMetric
          label="Observed GMV / verified fan"
          value={
            cohort.observedGmvPerVerifiedFanCents != null
              ? formatMoney(cohort.observedGmvPerVerifiedFanCents)
              : "—"
          }
        />
      </div>
    </div>
  );
}

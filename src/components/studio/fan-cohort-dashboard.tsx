import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CohortActivationHistory, CohortActivationCta } from "@/components/studio/cohort-activation-panel";
import { PilotReportCta } from "@/components/studio/pilot-report-cta";
import { CohortFanList } from "@/components/studio/cohort-fan-list";
import { CohortRelationshipTimeline } from "@/components/studio/cohort-relationship-timeline";
import { PostShowBehaviorPanel } from "@/components/studio/post-show-behavior-panel";
import { RelationshipFunnel } from "@/components/studio/relationship-funnel";
import { formatEventDate, formatMoney, formatPercent } from "@/lib/format";
import { cohortStageLabel, type CohortFunnelStage } from "@/lib/relationship-intelligence/types";
import { isActivatableCohortStage } from "@/lib/activation/audience";
import type { ShowCohortDetail } from "@/server/studio/fan-relationship-queries";
import type { ActivationDropSummary } from "@/server/activation/queries";

function CohortMetric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

export function FanCohortDashboard({
  cohort,
  eventPicker,
  activations = [],
}: {
  cohort: ShowCohortDetail;
  eventPicker?: React.ReactNode;
  activations?: ActivationDropSummary[];
}) {
  const { event } = cohort;
  const funnel = {
    attendees: cohort.originalVerifiedAttendees,
    connectedFans: cohort.connectedFans,
    purchasingFans: cohort.purchasingFans,
    postShowPurchasers: cohort.postShowPurchasers,
    repeatPurchasers: cohort.repeatPurchasers,
  };

  return (
    <div className="space-y-10">
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
              Show relationship intelligence
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {event.artistName} → {event.venueCity} →{" "}
              {formatEventDate(event.startsAt, event.timezone)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              What fan relationships did this show create — and what happened afterward?
            </p>
          </div>
          {eventPicker}
        </div>
        <PilotReportCta eventId={event.id} />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CohortMetric
          label="Connected fans"
          value={cohort.connectedFans.toLocaleString("en-US")}
          detail="Opted in from this show cohort"
        />
        <CohortMetric
          label="Purchasing fans"
          value={cohort.purchasingFans.toLocaleString("en-US")}
          detail="Connected with show-attributed purchase"
        />
        <CohortMetric
          label="Post-show purchasers"
          value={cohort.postShowPurchasers.toLocaleString("en-US")}
        />
        <CohortMetric
          label="Post-show GMV"
          value={formatMoney(cohort.postShowGmv90DaysCents)}
          detail="90-day attributed window"
        />
      </div>

      <RelationshipFunnel
        eventId={event.id}
        metrics={funnel}
        activeStage={cohort.activeStage}
      />

      {cohort.activeStage && isActivatableCohortStage(cohort.activeStage) ? (
        <CohortActivationCta
          eventId={event.id}
          cohortStage={cohort.activeStage}
          audienceLabel={`${event.venueCity} · ${cohortStageLabel(cohort.activeStage)}`}
          eligibleCount={
            cohort.activeStage === "connected"
              ? cohort.connectedFans
              : cohort.activeStage === "purchasing"
                ? cohort.purchasingFans
                : cohort.activeStage === "post_show"
                  ? cohort.postShowPurchasers
                  : cohort.repeatPurchasers
          }
        />
      ) : null}

      <CohortActivationHistory activations={activations} />

      <CohortRelationshipTimeline phases={cohort.timeline} />

      <PostShowBehaviorPanel windows={cohort.postShowWindows} />

      <CohortFanList eventId={event.id} fans={cohort.fanRows} activeStage={cohort.activeStage} />

      <details className="rounded-2xl border border-border bg-card p-5">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          All cohort metrics
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CohortMetric
            label="Verified attendees"
            value={cohort.originalVerifiedAttendees.toLocaleString("en-US")}
          />
          <CohortMetric
            label="Connected after show end"
            value={cohort.connectedAfterShow.toLocaleString("en-US")}
          />
          <CohortMetric
            label="Repeat purchasers"
            value={cohort.repeatPurchasers.toLocaleString("en-US")}
          />
          <CohortMetric label="Show-night GMV" value={formatMoney(cohort.showNightGmvCents)} />
          <CohortMetric
            label="30-day post-show GMV"
            value={formatMoney(cohort.postShowGmv30DaysCents)}
          />
          <CohortMetric
            label="Total observed GMV"
            value={formatMoney(cohort.totalObservedGmvCents)}
          />
          <CohortMetric
            label="Repeat purchase rate"
            value={
              cohort.repeatPurchaseRate != null ? formatPercent(cohort.repeatPurchaseRate) : "—"
            }
          />
          <CohortMetric
            label="Observed GMV / attendee"
            value={
              cohort.observedGmvPerVerifiedFanCents != null
                ? formatMoney(cohort.observedGmvPerVerifiedFanCents)
                : "—"
            }
          />
        </div>
      </details>
    </div>
  );
}

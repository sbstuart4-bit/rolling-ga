"use client";

import Link from "next/link";
import { Printer } from "lucide-react";
import { formatMoney, formatPercent } from "@/lib/format";
import { cohortHref } from "@/lib/relationship-intelligence/cohorts";
import { fulfillmentHref } from "@/lib/fulfillment";
import { pilotReportHref } from "@/lib/pilot-report/goals";
import { PILOT_GOAL_STATUS_LABELS } from "@/lib/pilot-report/types";
import { venueCommissionLabel } from "@/lib/show-economics/calculations";
import type { VenueCommissionTreatment } from "@/lib/show-economics/types";
import type { PilotReportSnapshot } from "@/server/studio/pilot-report-queries";
import { cn } from "@/lib/utils";

function ReportSection({
  title,
  narrative,
  children,
  className,
}: {
  title: string;
  narrative?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("pilot-report-section space-y-4", className)}>
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-300">
          {title}
        </h2>
        {narrative ? (
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{narrative}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs text-zinc-500">{detail}</p> : null}
    </div>
  );
}

function GoalStatusBadge({ status }: { status: keyof typeof PILOT_GOAL_STATUS_LABELS }) {
  const tone =
    status === "exceeded_target" || status === "met_target"
      ? "bg-emerald-500/15 text-emerald-300"
      : status === "below_target"
        ? "bg-amber-500/15 text-amber-200"
        : "bg-zinc-700/50 text-zinc-400";

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", tone)}>
      {PILOT_GOAL_STATUS_LABELS[status]}
    </span>
  );
}

function CompletenessBadge({ level }: { level: string }) {
  const tone =
    level === "complete"
      ? "text-emerald-300"
      : level === "unknown"
        ? "text-amber-300"
        : level === "missing"
          ? "text-red-300"
          : "text-zinc-400";
  return <span className={cn("text-xs font-semibold uppercase", tone)}>{level}</span>;
}

export function PilotReportDashboard({ report }: { report: PilotReportSnapshot }) {
  const { economics: econ } = report;

  const proceedsLabel =
    econ.combined.combinedComplete && econ.combined.combinedProceedsCents != null
      ? formatMoney(econ.combined.combinedProceedsCents)
      : "Pending contract treatment";

  return (
    <div className="pilot-report-root space-y-12 text-white">
      <div className="pilot-report-no-print flex justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] hover:bg-white/10"
        >
          <Printer className="size-4" aria-hidden />
          Print / Save as PDF
        </button>
      </div>

      {report.isDemoData ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Demo pilot report — metrics from seeded Brooklyn demonstration data. Fulfillment
          performance is simulated operational data, not carrier-certified.
        </div>
      ) : null}

      <header className="pilot-report-header space-y-4 border-b border-white/10 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-400">
          Rolling GA Pilot Report
        </p>
        <div>
          <h1 className="font-display text-3xl tracking-wide md:text-4xl">{report.artistName}</h1>
          <p className="mt-1 text-xl text-violet-200">{report.tourName ?? "Show"}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {report.venueCity} · {report.eventDateLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
          <span>Pilot period: Show night through T+30</span>
          <span>Generated {report.generatedAt.toLocaleString("en-US")}</span>
          <span className="capitalize">Data: {report.dataCompletenessStatus}</span>
        </div>
      </header>

      <ReportSection
        title="Executive outcome"
        narrative="Did Rolling GA improve the show enough to justify using it again? Measured outcomes only — no automatic success declaration."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total merch GMV"
            value={
              report.totalMerchGmvCents != null
                ? formatMoney(report.totalMerchGmvCents)
                : "—"
            }
            detail="Physical baseline + Rolling GA when both recorded"
          />
          <MetricCard label="Rolling GA GMV" value={formatMoney(econ.rollingGa.gmvCents)} />
          <MetricCard
            label="Post-show GMV"
            value={formatMoney(econ.rollingGa.postShowGmvCents)}
          />
          <MetricCard
            label="Connected fans"
            value={String(econ.connectedFanRelationships)}
          />
          <MetricCard
            label="Repeat purchasers"
            value={String(econ.repeatPurchasers)}
          />
          <MetricCard
            label="Activated revenue"
            value={formatMoney(econ.activatedPostShowGmvCents)}
          />
          <MetricCard
            label="Delivered within promise"
            value={
              report.fulfillment
                ? String(report.fulfillment.deliveredWithinPromise)
                : "—"
            }
            detail={
              report.fulfillment?.deliveryPromiseRate != null
                ? formatPercent(report.fulfillment.deliveryPromiseRate)
                : undefined
            }
          />
          <MetricCard
            label="Estimated artist proceeds"
            value={proceedsLabel}
            detail={
              !econ.combined.combinedComplete
                ? "Pending contract treatment"
                : "Physical + Rolling GA when inputs complete"
            }
          />
        </div>
      </ReportSection>

      <ReportSection title="Pilot goals">
        <div className="space-y-2">
          {report.goals.length === 0 ? (
            <p className="text-sm text-zinc-500">No pilot goals defined for this show.</p>
          ) : (
            report.goals.map((goal) => (
              <div
                key={goal.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{goal.label}</p>
                  {goal.note ? <p className="mt-0.5 text-xs text-zinc-500">{goal.note}</p> : null}
                  <p className="mt-1 text-xs text-zinc-400">
                    Target {goal.formattedTarget}
                    {goal.formattedActual ? ` · Actual ${goal.formattedActual}` : " · Actual —"}
                  </p>
                </div>
                <GoalStatusBadge status={goal.status} />
              </div>
            ))
          )}
        </div>
      </ReportSection>

      <ReportSection title="Physical vs Rolling GA">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChannelCard
            title="Traditional physical merch"
            rows={[
              ["GMV", formatMoney(econ.physical.physicalMerchGmvCents ?? null) || "Not provided"],
              ["Units sold", econ.physical.unitsSold?.toLocaleString("en-US") ?? "Not provided"],
              ["Stockouts", econ.physical.stockoutCount?.toLocaleString("en-US") ?? "Not provided"],
              [
                "Venue treatment",
                venueCommissionLabel(econ.physical.venueCommissionTreatment),
              ],
              [
                "Est. proceeds",
                econ.physicalComputed.proceedsComplete
                  ? formatMoney(econ.physicalComputed.estimatedProceedsCents)
                  : "Incomplete",
              ],
            ]}
          />
          <ChannelCard
            title="Rolling GA digital / ship-to-home"
            rows={[
              ["GMV", formatMoney(econ.rollingGa.gmvCents)],
              ["Orders", String(econ.rollingGa.orderCount)],
              ["AOV", formatMoney(econ.rollingGa.aovCents)],
              [
                "Venue treatment",
                venueCommissionLabel(econ.config.digitalVenueCommissionTreatment),
              ],
              [
                "Est. proceeds",
                econ.rollingGaBridge.complete
                  ? formatMoney(econ.rollingGaBridge.proceedsCents)
                  : "Incomplete",
              ],
            ]}
          />
        </div>
      </ReportSection>

      <ReportSection
        title="Commerce story"
        narrative="Show-night and post-show GMV with activation split — no double counting."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Show-night GMV" value={formatMoney(econ.rollingGa.showNightGmvCents)} />
          <MetricCard label="Post-show GMV" value={formatMoney(econ.rollingGa.postShowGmvCents)} />
          <MetricCard
            label="Activated post-show GMV"
            value={formatMoney(econ.activatedPostShowGmvCents)}
          />
          <MetricCard
            label="Organic post-show GMV"
            value={formatMoney(econ.organicPostShowGmvCents)}
          />
          <MetricCard label="Orders" value={String(econ.rollingGa.orderCount)} />
          <MetricCard label="AOV" value={formatMoney(econ.rollingGa.aovCents)} />
          <MetricCard label="Units" value={String(econ.rollingGa.unitCount)} />
        </div>
      </ReportSection>

      <ReportSection
        title="Relationship story"
        narrative="The show created an audience."
      >
        {report.cohort ? (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-5">
              <FunnelStep label="Attendees" value={report.cohort.originalVerifiedAttendees} />
              <FunnelStep label="Connected" value={report.cohort.connectedFans} />
              <FunnelStep label="Purchasing" value={report.cohort.purchasingFans} />
              <FunnelStep label="Post-show" value={report.cohort.postShowPurchasers} />
              <FunnelStep label="Repeat" value={report.cohort.repeatPurchasers} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Post-show observed GMV"
                value={formatMoney(report.cohort.postShowGmv90DaysCents)}
              />
              <MetricCard
                label="Total observed GMV"
                value={formatMoney(report.cohort.totalObservedGmvCents)}
              />
            </div>
            <Link
              href={cohortHref(report.eventId)}
              className="pilot-report-no-print text-xs font-semibold uppercase tracking-[0.12em] text-violet-300 hover:text-violet-200"
            >
              View the fans →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Relationship metrics not available.</p>
        )}
      </ReportSection>

      <ReportSection
        title="Activation story"
        narrative="The artist activated the relationship."
      >
        {report.activation ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Drop" value={report.activation.title} />
            <MetricCard label="Eligible fans" value={String(report.activation.eligibleFans)} />
            <MetricCard label="Purchasers" value={String(report.activation.purchasingFans)} />
            <MetricCard
              label="Conversion"
              value={
                report.activation.conversionRate != null
                  ? formatPercent(report.activation.conversionRate)
                  : "—"
              }
            />
            <MetricCard label="Orders" value={String(report.activation.orderCount)} />
            <MetricCard
              label="Activated revenue"
              value={formatMoney(report.activation.activatedRevenueCents)}
            />
            <MetricCard
              label="AOV"
              value={
                report.activation.averageOrderValueCents != null
                  ? formatMoney(report.activation.averageOrderValueCents)
                  : "—"
              }
            />
            <MetricCard
              label="Repeat purchasers"
              value={String(report.activation.repeatPurchasers)}
            />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No activation drop measured for this show.</p>
        )}
      </ReportSection>

      <ReportSection
        title="Fulfillment story"
        narrative="The operation delivered the promise. Demo operational data — not carrier-certified."
      >
        {report.fulfillment ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="Delivered" value={String(report.fulfillment.deliveredCount)} />
            <MetricCard
              label="Delivered within promise"
              value={String(report.fulfillment.deliveredWithinPromise)}
            />
            <MetricCard
              label="Delivery promise rate"
              value={
                report.fulfillment.deliveryPromiseRate != null
                  ? formatPercent(report.fulfillment.deliveryPromiseRate)
                  : "—"
              }
            />
            <MetricCard
              label="Past promise (undelivered)"
              value={String(report.fulfillment.pastPromiseCount)}
            />
            <MetricCard label="At risk" value={String(report.fulfillment.atRiskCount)} />
            <MetricCard label="Open exceptions" value={String(report.fulfillment.openExceptions)} />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No fulfillment data for qualifying orders.</p>
        )}
        <Link
          href={fulfillmentHref(report.eventId)}
          className="pilot-report-no-print mt-2 inline-block text-xs font-semibold uppercase tracking-[0.12em] text-sky-300 hover:text-sky-200"
        >
          View fulfillment →
        </Link>
      </ReportSection>

      <ReportSection title="Venue commission treatment">
        <div className="grid gap-3 sm:grid-cols-2">
          <VenueTreatmentCard
            channel="Physical merch"
            treatment={econ.physical.venueCommissionTreatment}
          />
          <VenueTreatmentCard
            channel="Digital / ship-to-home"
            treatment={econ.config.digitalVenueCommissionTreatment}
          />
        </div>
      </ReportSection>

      <ReportSection title="What we learned">
        <ul className="space-y-3">
          {report.learnings.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3"
            >
              <p className="font-medium">{item.question}</p>
              <p className="mt-1 text-sm text-zinc-400">{item.evidence}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
                {item.status.replace(/_/g, " ")}
              </p>
            </li>
          ))}
        </ul>
      </ReportSection>

      <ReportSection title="Data completeness">
        <ul className="space-y-2">
          {report.completeness.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-white/5 px-3 py-2 text-sm"
            >
              <span>{item.label}</span>
              <span className="text-zinc-500">{item.detail}</span>
              <CompletenessBadge level={item.level} />
            </li>
          ))}
        </ul>
      </ReportSection>

      <section className="pilot-report-section rounded-2xl border border-violet-500/25 bg-violet-950/30 p-6 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-300">
          Report conclusion
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
          <p><strong className="text-white">What happened.</strong> {report.conclusion.whatHappened}</p>
          <p><strong className="text-white">What we learned.</strong> {report.conclusion.whatWeLearned}</p>
          <p><strong className="text-white">What remains unknown.</strong> {report.conclusion.whatRemainsUnknown}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
            Recommended next test
          </p>
          <p className="mt-2 text-sm text-white">{report.conclusion.recommendedNextTest}</p>
        </div>
      </section>

      <footer className="pilot-report-print-footer hidden text-center text-xs text-zinc-500">
        {report.artistName} · {report.venueCity} · {report.eventDateLabel} · Rolling GA Pilot Report
      </footer>
    </div>
  );
}

function ChannelCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">{title}</p>
      <dl className="mt-4 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-sm">
            <dt className="text-zinc-500">{label}</dt>
            <dd className="tabular-nums text-right text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function FunnelStep({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/50 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function VenueTreatmentCard({
  channel,
  treatment,
}: {
  channel: string;
  treatment: VenueCommissionTreatment;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
      <p className="text-xs text-zinc-500">{channel}</p>
      <p className="mt-1 text-lg font-semibold">{venueCommissionLabel(treatment)}</p>
      {treatment === "UNKNOWN" ? (
        <p className="mt-1 text-xs text-amber-200/90">Contract treatment not confirmed.</p>
      ) : null}
    </div>
  );
}

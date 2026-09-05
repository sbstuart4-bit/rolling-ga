import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { TrendChart } from "@/components/shared/trend-chart";
import { formatMoney, formatEventDate } from "@/lib/format";
import {
  COMMERCE_MOMENT_LABELS,
  DEFAULT_PILOT_CRITERIA,
  evaluateCriterion,
  type MetricAvailability,
} from "@/lib/insights-economics";
import type { EventInsightsSnapshot } from "@/server/studio/insights-queries";
import { cn } from "@/lib/utils";

export function InsightsDashboard({
  snapshot,
  pilotHref,
  eventPicker,
}: {
  snapshot: EventInsightsSnapshot;
  pilotHref: string;
  eventPicker?: React.ReactNode;
}) {
  const { event, scorecard, rollingGa, endlessAisle, shipping, fans, drops, moments, isDemoData } =
    snapshot;

  return (
    <div className="space-y-10">
      {isDemoData && (
        <DemoBanner label="Demo data — metrics reflect seeded demonstration orders, not live venue sales." />
      )}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400">Insights</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
            {event.venueCity}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {formatEventDate(event.startsAt, event.timezone)} · {event.tourName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {eventPicker}
          <Link
            href={pilotHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
          >
            Rolling GA Pilot
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </header>

      {/* 1. Executive scorecard */}
      <section className="grid gap-4 lg:grid-cols-2">
        <HeroMetric
          label="Merch GMV / attendee"
          question="Did we sell more?"
          metric={scorecard.merchGmvPerAttendee}
          format="money"
          accent="violet"
        />
        <HeroMetric
          label="Contribution profit / attendee"
          question="Did the artist make more?"
          metric={scorecard.contributionPerAttendee}
          format="money"
          accent="emerald"
          incompleteMessage={
            !scorecard.contributionComplete
              ? `Contribution data incomplete — missing: ${scorecard.missingInputs.join(", ")}`
              : undefined
          }
        />
      </section>

      {/* 2. Rolling GA commerce */}
      <Section title="Rolling GA commerce">
        <MetricGrid
          items={[
            { label: "Rolling GA GMV", value: formatMoney(rollingGa.gmvCents) },
            { label: "Orders", value: rollingGa.orderCount.toLocaleString("en-US") },
            { label: "Units", value: rollingGa.unitCount.toLocaleString("en-US") },
            { label: "AOV", value: formatMoney(rollingGa.aovCents) },
            {
              label: "Verified conversion",
              value: formatRatio(rollingGa.conversion),
            },
            { label: "Digital-only sales", value: formatMoney(rollingGa.digitalOnlyCents) },
            { label: "City-exclusive sales", value: formatMoney(rollingGa.cityExclusiveCents) },
            { label: "Flash-drop sales", value: formatMoney(rollingGa.flashDropCents) },
            { label: "Bundle sales", value: formatMoney(rollingGa.bundleCents) },
            {
              label: "Event-scoped orders",
              value: rollingGa.eventScopedOrderCount.toLocaleString("en-US"),
            },
          ]}
        />
      </Section>

      {/* 3. Endless aisle */}
      <Section title="Sales beyond the physical booth">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Physical / core" value={formatMoney(endlessAisle.physicalCoreCents)} />
          <StatCard label="Endless Aisle" value={formatMoney(endlessAisle.endlessAisleCents)} accent />
          <StatCard label="Beyond booth" value={formatMoney(endlessAisle.beyondBoothCents)} accent />
        </div>
        {endlessAisle.beyondBoothStatement ? (
          <p className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-violet-100">
            {endlessAisle.beyondBoothStatement}
          </p>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No Endless Aisle sales recorded for this show yet.</p>
        )}
      </Section>

      {/* 4. Shipping economics */}
      <Section title="Shipping economics">
        <MetricGrid
          items={[
            { label: "Carrier shipping cost", value: formatMoney(shipping.carrierCostCents) },
            { label: "Fan shipping charges", value: formatMoney(shipping.fanChargeCents) },
            { label: "Artist shipping subsidy", value: formatMoney(shipping.artistSubsidyCents) },
            { label: "Free-shipping cost", value: formatMoney(shipping.freeShippingCostCents) },
            {
              label: "Subsidy / order",
              value:
                shipping.subsidyPerOrderCents != null
                  ? formatMoney(shipping.subsidyPerOrderCents)
                  : "—",
            },
            {
              label: "Contribution after shipping",
              value: shipping.contributionComplete
                ? formatMoney(shipping.contributionAfterShippingCents ?? 0)
                : "Incomplete",
              warn: !shipping.contributionComplete,
            },
          ]}
        />
      </Section>

      {/* 5. Fan relationship */}
      <Section title="Fan relationship">
        <MetricGrid
          items={[
            { label: "Verified attendees", value: fans.verifiedAttendees.toLocaleString("en-US") },
            { label: "Connected fans", value: fans.connectedFans.toLocaleString("en-US") },
            { label: "Consent rate", value: formatRatio(fans.consentRate), hint: "Not counted as consent" },
            {
              label: "Purchasers who connected",
              value: `${fans.purchasersConnected} / ${fans.purchasersTotal}`,
            },
            { label: "Repeat Rolling GA purchasers", value: fans.repeatPurchasers.toLocaleString("en-US") },
          ]}
        />
      </Section>

      {/* 6. Drop performance */}
      {drops.length > 0 && (
        <Section title="Drop performance">
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-800 text-[10px] uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Drop</th>
                  <th className="px-4 py-3">Eligible</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">GMV</th>
                  <th className="px-4 py-3">Conv.</th>
                  <th className="px-4 py-3">Contribution</th>
                  <th className="px-4 py-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {drops.map((drop) => (
                  <tr key={drop.dropId}>
                    <td className="px-4 py-3 font-medium">{drop.title}</td>
                    <td className="px-4 py-3 tabular">{drop.eligibleFans}</td>
                    <td className="px-4 py-3 tabular">{drop.orderCount}</td>
                    <td className="px-4 py-3 tabular">{formatMoney(drop.gmvCents)}</td>
                    <td className="px-4 py-3 tabular">{formatRatio(drop.conversion)}</td>
                    <td className="px-4 py-3 tabular">
                      {drop.contributionComplete
                        ? formatMoney(drop.contributionCents ?? 0)
                        : "Incomplete"}
                    </td>
                    <td className="px-4 py-3 tabular text-zinc-400">
                      {drop.durationMinutes != null ? `${drop.durationMinutes}m` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Views unavailable — no impression tracking configured.</p>
        </Section>
      )}

      {/* 7. Event moment performance */}
      {moments.length > 0 && (
        <Section title="When does the audience buy?">
          <TrendChart
            data={moments.map((m) => ({
              label: COMMERCE_MOMENT_LABELS[m.moment],
              value: m.gmvCents / 100,
            }))}
            color="var(--color-violet-400, #a78bfa)"
            height={180}
            unit=""
          />
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {moments.map((m) => (
              <li key={m.moment} className="rounded-lg border border-zinc-800 px-3 py-2 text-sm">
                <p className="text-zinc-400">{COMMERCE_MOMENT_LABELS[m.moment]}</p>
                <p className="font-semibold tabular">{formatMoney(m.gmvCents)}</p>
                <p className="text-xs text-zinc-500">{m.orderCount} orders</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 9. Baseline */}
      <Section title="Baseline vs Rolling GA">
        <BaselinePlaceholder />
      </Section>

      {/* 10. Pilot success criteria */}
      <Section title="Pilot success criteria">
        <PilotCriteriaPanel snapshot={snapshot} />
      </Section>
    </div>
  );
}

function HeroMetric({
  label,
  question,
  metric,
  format,
  accent,
  incompleteMessage,
}: {
  label: string;
  question: string;
  metric: MetricAvailability;
  format: "money" | "number";
  accent: "violet" | "emerald";
  incompleteMessage?: string;
}) {
  const display =
    metric.status === "available"
      ? format === "money"
        ? formatMoney(metric.value)
        : metric.value.toLocaleString("en-US")
      : metric.status === "incomplete"
        ? "Contribution data incomplete"
        : metric.reason;

  return (
    <div
      className={cn(
        "rounded-2xl border p-6",
        accent === "violet"
          ? "border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-zinc-950"
          : "border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-zinc-950",
      )}
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-3 text-4xl font-semibold tabular tracking-tight text-white">{display}</p>
      <p className="mt-2 text-sm text-zinc-400">{question}</p>
      {incompleteMessage && (
        <p className="mt-3 flex items-start gap-2 text-xs text-amber-300/90">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {incompleteMessage}
        </p>
      )}
      {metric.status === "incomplete" && metric.missing.length > 0 && !incompleteMessage && (
        <p className="mt-3 text-xs text-amber-300/90">Missing: {metric.missing.join(", ")}</p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">{title}</h2>
      {children}
    </section>
  );
}

function MetricGrid({
  items,
}: {
  items: { label: string; value: string; hint?: string; warn?: boolean }[];
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-4 py-3">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{item.label}</dt>
          <dd
            className={cn(
              "mt-1 text-lg font-semibold tabular",
              item.warn ? "text-amber-300" : "text-white",
            )}
          >
            {item.value}
          </dd>
          {item.hint && <p className="mt-0.5 text-[10px] text-zinc-600">{item.hint}</p>}
        </div>
      ))}
    </dl>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-4",
        accent ? "border-violet-500/30 bg-violet-500/5" : "border-zinc-800 bg-zinc-950/50",
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular text-white">{value}</p>
    </div>
  );
}

function BaselinePlaceholder() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/30 px-5 py-8 text-center">
      <p className="font-medium text-zinc-300">Physical merch baseline not connected</p>
      <p className="mt-2 text-sm text-zinc-500">
        Requires baseline import — Rolling GA will not claim incremental revenue without POS or
        venue booth data.
      </p>
      <p className="mt-3 text-xs uppercase tracking-wide text-zinc-600">Requires baseline</p>
    </div>
  );
}

function PilotCriteriaPanel({ snapshot }: { snapshot: EventInsightsSnapshot }) {
  const metrics: Record<string, number | null> = {
    gmvPerAttendee:
      snapshot.scorecard.merchGmvPerAttendee.status === "available"
        ? snapshot.scorecard.merchGmvPerAttendee.value
        : null,
    contributionPerAttendee:
      snapshot.scorecard.contributionPerAttendee.status === "available"
        ? snapshot.scorecard.contributionPerAttendee.value
        : null,
    aovCents: snapshot.rollingGa.aovCents,
    conversionRate:
      snapshot.rollingGa.conversion.status === "available"
        ? snapshot.rollingGa.conversion.value
        : null,
    endlessAisleCents: snapshot.endlessAisle.endlessAisleCents,
    shippingSubsidyPerOrder: snapshot.shipping.subsidyPerOrderCents,
    consentRate:
      snapshot.fans.consentRate.status === "available" ? snapshot.fans.consentRate.value : null,
  };

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {DEFAULT_PILOT_CRITERIA.map((criterion) => {
        const { met, actual } = evaluateCriterion(criterion, metrics);
        return (
          <li
            key={criterion.id}
            className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2 text-sm"
          >
            <span className="text-zinc-400">
              {criterion.tier === "primary" && (
                <span className="mr-2 text-[10px] uppercase text-violet-400">Primary</span>
              )}
              {criterion.label}
            </span>
            <span
              className={cn(
                "tabular font-medium",
                met === true && "text-emerald-400",
                met === false && "text-zinc-400",
                met === null && "text-zinc-600",
              )}
            >
              {actual == null
                ? "Unavailable"
                : criterion.unit === "cents"
                  ? formatMoney(actual)
                  : criterion.unit === "percent" || criterion.unit === "ratio"
                    ? `${(actual * 100).toFixed(1)}%`
                    : actual}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function DemoBanner({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
      Demo — {label}
    </div>
  );
}

function formatRatio(metric: MetricAvailability): string {
  if (metric.status === "available") return `${(metric.value * 100).toFixed(1)}%`;
  if (metric.status === "incomplete") return "Incomplete";
  return metric.reason;
}

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { fulfillmentHref } from "@/lib/fulfillment";
import { pilotReportHref } from "@/lib/pilot-report/goals";
import { venueCommissionLabel } from "@/lib/show-economics/calculations";
import type { ShowEconomicsSnapshot } from "@/lib/show-economics/types";
import { ShowEconomicsBaselineForm } from "@/components/studio/show-economics-baseline-form";
import { ShowEconomicsRelationshipOutcome } from "@/components/studio/show-economics-relationship-outcome";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function ProceedsBlock({
  title,
  amountCents,
  complete,
  missing,
}: {
  title: string;
  amountCents: number | null;
  complete: boolean;
  missing: string[];
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">{title}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
        {complete && amountCents != null ? formatMoney(amountCents) : "—"}
      </p>
      {!complete && missing.length > 0 ? (
        <p className="mt-2 text-xs text-amber-200/90">
          Incomplete — {missing.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

export function ShowEconomicsDashboard({
  snapshot,
  backHref,
}: {
  snapshot: ShowEconomicsSnapshot;
  backHref: string;
}) {
  const { physical, physicalComputed, rollingGa, rollingGaBridge, combined, config } = snapshot;

  return (
    <div className="space-y-10">
      {snapshot.isDemoData ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Demo data — Rolling GA metrics from seeded orders; physical baseline is representative pilot
          input.
        </div>
      ) : null}

      <header className="space-y-3">
        <Link href={backHref} className="text-sm text-violet-300 hover:text-violet-200">
          ← Back to insights
        </Link>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400">
          Show economics
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">{snapshot.eventLabel}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
          Did Rolling GA make this show economically better for the artist? Compare traditional
          physical merch to ship-to-home digital commerce — without assuming venue commissions
          disappear automatically.
        </p>
        <Link
          href={fulfillmentHref(snapshot.eventId)}
          className="inline-flex text-xs font-semibold uppercase tracking-[0.12em] text-sky-300 hover:text-sky-200"
        >
          View fulfillment →
        </Link>
        <Link
          href={pilotReportHref(snapshot.eventId)}
          className="inline-flex text-xs font-semibold uppercase tracking-[0.12em] text-violet-300 hover:text-violet-200"
        >
          View pilot report →
        </Link>
      </header>

      {/* Show outcome */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">
          Show outcome
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Rolling GA GMV" value={formatMoney(rollingGa.gmvCents)} />
          <Metric label="Show-night GMV" value={formatMoney(rollingGa.showNightGmvCents)} />
          <Metric label="Post-show GMV" value={formatMoney(rollingGa.postShowGmvCents)} />
          <Metric
            label="Connected fan relationships"
            value={String(snapshot.connectedFanRelationships)}
          />
        </div>
      </section>

      {/* Physical vs Rolling GA */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">
          Physical vs Rolling GA
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChannelCard
            title="Traditional physical merch"
            metrics={[
              ["Physical GMV", formatMoney(physical.physicalMerchGmvCents ?? 0)],
              ["Units sold", physical.unitsSold != null ? String(physical.unitsSold) : "—"],
              ["Stockouts", physical.stockoutCount != null ? String(physical.stockoutCount) : "—"],
              [
                "Venue treatment",
                venueCommissionLabel(physical.venueCommissionTreatment),
              ],
              [
                "Venue commission",
                physicalComputed.venueCommissionCents != null
                  ? formatMoney(physicalComputed.venueCommissionCents)
                  : "Contract treatment not confirmed",
              ],
            ]}
            qualities={[
              "Limited inventory at venue",
              "Physical queue at merch table",
              "Stockout risk on popular sizes",
              "Fan carries merch through the show",
              "Transaction may remain anonymous",
            ]}
          />
          <ChannelCard
            title="Rolling GA digital / ship-to-home"
            metrics={[
              ["Rolling GA GMV", formatMoney(rollingGa.gmvCents)],
              ["Orders", String(rollingGa.orderCount)],
              ["Purchasing fans", String(rollingGa.purchasingFans)],
              [
                "Venue treatment",
                venueCommissionLabel(config.digitalVenueCommissionTreatment),
              ],
              ["Repeat purchasers", String(rollingGa.repeatPurchasers)],
            ]}
            qualities={[
              "Expanded digital catalog",
              "No physical checkout line",
              "Ship-to-home fulfillment",
              "Less physical inventory dependency",
              "Known purchasing fan in Rolling GA",
              "Measurable post-show commerce",
            ]}
          />
        </div>

        <div className="space-y-2 rounded-2xl border border-white/10 bg-zinc-900/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Operating model comparison
          </p>
          <ul className="space-y-3">
            {snapshot.comparisonRows.map((row) => (
              <li key={row.label} className="grid gap-2 border-b border-white/5 pb-3 last:border-0">
                <p className="text-xs font-medium text-violet-300">{row.label}</p>
                <p className="text-sm text-zinc-400">
                  <span className="text-zinc-500">Physical:</span> {row.physical}
                </p>
                <p className="text-sm text-zinc-300">
                  <span className="text-zinc-500">Rolling GA:</span> {row.rollingGa}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Economic bridge */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">
          Economic bridge — Rolling GA
        </h2>
        <div className="space-y-2 rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
          {rollingGaBridge.lines.map((line) => (
            <div
              key={line.key}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/5 py-2 last:border-0"
            >
              <div>
                <p className="text-sm text-zinc-200">
                  {line.subtract ? "− " : ""}
                  {line.label}
                </p>
                {line.note ? <p className="text-xs text-zinc-500">{line.note}</p> : null}
              </div>
              <p className="text-sm font-medium tabular-nums text-white">
                {line.amountCents != null ? formatMoney(line.amountCents) : "—"}
              </p>
            </div>
          ))}
          <div className="flex flex-wrap items-baseline justify-between gap-2 pt-3">
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-emerald-300">
              Estimated artist proceeds
            </p>
            <p className="text-lg font-semibold tabular-nums text-white">
              {rollingGaBridge.complete && rollingGaBridge.proceedsCents != null
                ? formatMoney(rollingGaBridge.proceedsCents)
                : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* Combined + relationship value */}
      <section className="grid gap-4 lg:grid-cols-3">
        <ProceedsBlock
          title="Physical baseline proceeds"
          amountCents={physicalComputed.estimatedProceedsCents}
          complete={physicalComputed.proceedsComplete}
          missing={physicalComputed.missingInputs}
        />
        <ProceedsBlock
          title="Rolling GA proceeds"
          amountCents={rollingGaBridge.proceedsCents}
          complete={rollingGaBridge.complete}
          missing={rollingGaBridge.missing}
        />
        <ProceedsBlock
          title="Combined show proceeds"
          amountCents={combined.combinedProceedsCents}
          complete={combined.combinedComplete}
          missing={[
            ...physicalComputed.missingInputs,
            ...rollingGaBridge.missing,
          ]}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Metric label="Post-show GMV (observed)" value={formatMoney(rollingGa.postShowGmvCents)} />
        <Metric
          label="Connected fan relationships"
          value={String(snapshot.connectedFanRelationships)}
        />
      </section>

      <ShowEconomicsRelationshipOutcome
        eventId={snapshot.eventId}
        connectedFans={snapshot.connectedFanRelationships}
        postShowPurchasers={snapshot.postShowPurchasers}
        repeatPurchasers={snapshot.repeatPurchasers}
        postShowGmvCents={snapshot.postShowRelationshipGmvCents}
        activatedPostShowGmvCents={snapshot.activatedPostShowGmvCents}
      />

      <section className="space-y-3 rounded-2xl border border-white/10 bg-zinc-950/50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">
          Assumptions
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-400">
          <li>
            Platform fee: {(config.platformFeeBasisPoints / 100).toFixed(2)}% of Rolling GA GMV.
          </li>
          <li>
            Digital venue commission: {venueCommissionLabel(config.digitalVenueCommissionTreatment)}
            {config.digitalVenueCommissionTreatment === "UNKNOWN"
              ? " — no zero-commission assumption applied."
              : ""}
          </li>
          <li>
            Physical venue commission: {venueCommissionLabel(physical.venueCommissionTreatment)}
          </li>
          <li>Relationship value is observed post-show GMV and connected fans — not speculative LTV.</li>
        </ul>
      </section>

      <ShowEconomicsBaselineForm eventId={snapshot.eventId} physical={physical} config={config} />
    </div>
  );
}

function ChannelCard({
  title,
  metrics,
  qualities,
}: {
  title: string;
  metrics: [string, string][];
  qualities: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-white">{title}</h3>
      <dl className="mt-4 space-y-2">
        {metrics.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 text-sm">
            <dt className="text-zinc-500">{label}</dt>
            <dd className="text-right font-medium tabular-nums text-zinc-200">{value}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-xs text-zinc-400">
        {qualities.map((item) => (
          <li key={item}>→ {item}</li>
        ))}
      </ul>
    </div>
  );
}

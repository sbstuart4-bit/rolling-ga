import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { venueCommissionLabel } from "@/lib/show-economics/calculations";
import type { ShowEconomicsSnapshot } from "@/lib/show-economics/types";

/** Compact economics summary for guided demo step 6 — derived from snapshot, not hard-coded. */
export function ShowEconomicsHeadlineSummary({
  snapshot,
  economicsHref,
  cohortHref,
}: {
  snapshot: ShowEconomicsSnapshot;
  economicsHref: string;
  cohortHref?: string;
}) {
  const { rollingGa, rollingGaBridge, combined, physical, config } = snapshot;

  return (
    <div className="mx-auto mt-8 max-w-2xl space-y-4 text-left">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
        Show economics summary
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <HeadlineMetric label="Rolling GA GMV" value={formatMoney(rollingGa.gmvCents)} />
        <HeadlineMetric label="Show-night GMV" value={formatMoney(rollingGa.showNightGmvCents)} />
        <HeadlineMetric label="Post-show GMV" value={formatMoney(rollingGa.postShowGmvCents)} />
        <HeadlineMetric
          label="Activated post-show GMV"
          value={formatMoney(snapshot.activatedPostShowGmvCents)}
        />
        <HeadlineMetric
          label="Physical merch GMV"
          value={
            physical.physicalMerchGmvCents != null
              ? formatMoney(physical.physicalMerchGmvCents)
              : "—"
          }
        />
        <HeadlineMetric
          label="Connected fan relationships"
          value={String(snapshot.connectedFanRelationships)}
        />
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
        <p className="font-medium text-zinc-200">Estimated artist proceeds</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <ProceedsLine
            label="Physical"
            cents={snapshot.physicalComputed.estimatedProceedsCents}
            complete={snapshot.physicalComputed.proceedsComplete}
          />
          <ProceedsLine
            label="Rolling GA"
            cents={rollingGaBridge.proceedsCents}
            complete={rollingGaBridge.complete}
          />
          <ProceedsLine
            label="Combined"
            cents={combined.combinedProceedsCents}
            complete={combined.combinedComplete}
          />
        </div>
        {!rollingGaBridge.complete ? (
          <p className="mt-3 text-xs text-amber-200/90">
            Rolling GA proceeds incomplete — {venueCommissionLabel(config.digitalVenueCommissionTreatment)}
            {config.digitalVenueCommissionTreatment === "UNKNOWN"
              ? ". Contract treatment not confirmed; no zero-commission assumption applied."
              : ""}
          </p>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <HeadlineMetric
          label="Post-show purchasers"
          value={String(snapshot.postShowPurchasers)}
        />
        <HeadlineMetric
          label="Repeat purchasers"
          value={String(snapshot.repeatPurchasers)}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-4 text-center">
        <Link
          href={economicsHref}
          className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-300 hover:text-violet-200"
        >
          View full show economics →
        </Link>
        {cohortHref ? (
          <Link
            href={cohortHref}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-300 hover:text-violet-200"
          >
            View the fans →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function HeadlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/60 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function ProceedsLine({
  label,
  cents,
  complete,
}: {
  label: string;
  cents: number | null;
  complete: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-semibold tabular-nums text-white">
        {complete && cents != null ? formatMoney(cents) : "—"}
      </p>
    </div>
  );
}

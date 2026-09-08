import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatEventDate, formatMoney, formatPercent } from "@/lib/format";
import type { ActivationResultsMetrics } from "@/lib/activation/revenue";
import type { ActivationAudiencePreview } from "@/server/activation/queries";

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

export function ActivationResultsDashboard({
  drop,
  audience,
  results,
  originShowLabel,
}: {
  drop: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    startsAt: Date;
    endsAt: Date | null;
    productNames: string[];
  };
  audience: ActivationAudiencePreview | null;
  results: ActivationResultsMetrics;
  originShowLabel: string;
}) {
  const durationLabel =
    drop.endsAt
      ? `${formatEventDate(drop.startsAt)} – ${formatEventDate(drop.endsAt)}`
      : formatEventDate(drop.startsAt);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Link
          href="/studio/drops"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Drops
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Activation results
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{drop.title}</h1>
          {drop.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{drop.description}</p>
          ) : null}
        </div>
      </header>

      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-300">
          Audience activation
        </p>
        {audience ? (
          <>
            <p className="font-medium">{audience.audienceLabel}</p>
            <p className="text-sm text-muted-foreground">Origin show: {originShowLabel}</p>
            <p className="text-sm text-muted-foreground">
              {results.eligibleFans.toLocaleString("en-US")} fans were eligible at publish
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">General audience drop</p>
        )}
        <p className="text-sm text-muted-foreground">
          Status: {drop.status} · {durationLabel}
        </p>
        {drop.productNames.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Product{drop.productNames.length > 1 ? "s" : ""}: {drop.productNames.join(", ")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ResultMetric label="Eligible fans" value={String(results.eligibleFans)} />
        <ResultMetric label="Purchasing fans" value={String(results.purchasingFans)} />
        <ResultMetric
          label="Conversion"
          value={
            results.conversionRate != null ? formatPercent(results.conversionRate) : "—"
          }
        />
        <ResultMetric label="Orders" value={String(results.orderCount)} />
        <ResultMetric
          label="Activated revenue"
          value={formatMoney(results.activatedRevenueCents)}
        />
        <ResultMetric
          label="Average order value"
          value={
            results.averageOrderValueCents != null
              ? formatMoney(results.averageOrderValueCents)
              : "—"
          }
        />
        <ResultMetric label="Repeat purchasers" value={String(results.repeatPurchasers)} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, DollarSign, Repeat, ShoppingBag, UserCheck, Users } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { FanRelationshipAggregateMetrics } from "@/server/studio/fan-relationship-queries";

function MetricTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function FansMetricsHeader({
  metrics,
  cohortHref,
}: {
  metrics: FanRelationshipAggregateMetrics;
  cohortHref?: string;
}) {
  return (
    <div className="space-y-4">
      {metrics.isDemoData && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Demo data — relationship metrics reflect seeded demonstration activity, not live venue
          sales.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricTile
          label="Verified fans"
          value={metrics.verifiedFans.toLocaleString("en-US")}
          sub="Attendance credentials across all shows"
        />
        <MetricTile
          label="Connected fans"
          value={metrics.connectedFans.toLocaleString("en-US")}
          sub="Opted in to artist connection"
        />
        <MetricTile
          label="Purchasing fans"
          value={metrics.purchasingFans.toLocaleString("en-US")}
          sub="At least one paid order"
        />
        <MetricTile
          label="Repeat purchasers"
          value={metrics.repeatPurchasers.toLocaleString("en-US")}
          sub="Two or more paid orders"
        />
        <MetricTile
          label="Post-show GMV"
          value={formatMoney(metrics.postShowGmvCents)}
          sub="Attributed revenue after show end"
        />
        <MetricTile
          label="Avg. revenue / connected fan"
          value={
            metrics.avgRevenuePerConnectedFanCents != null
              ? formatMoney(metrics.avgRevenuePerConnectedFanCents)
              : "—"
          }
          sub="Total GMV ÷ connected fans"
        />
      </div>

      {cohortHref && (
        <Link
          href={cohortHref}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium hover:bg-muted/70"
        >
          <Users className="size-4 text-muted-foreground" aria-hidden />
          Show cohort value
          <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function FanRelationshipIcon({ kind }: { kind: "verification" | "purchase" | "connection" | "drop" }) {
  const Icon =
    kind === "verification"
      ? UserCheck
      : kind === "purchase"
        ? ShoppingBag
        : kind === "connection"
          ? Users
          : DollarSign;
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon className="size-4" aria-hidden />
    </div>
  );
}

export function ObservedValueBadge({ cents }: { cents: number }) {
  return (
    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
      {formatMoney(cents)}
    </span>
  );
}

export function RepeatIcon() {
  return <Repeat className="size-4" aria-hidden />;
}

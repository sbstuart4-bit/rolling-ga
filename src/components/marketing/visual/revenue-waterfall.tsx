import { ClaimLabel } from "@/components/marketing/claim-label";
import { OBSERVED_FAN_VALUE } from "@/components/marketing/marketing-fixtures";
import { cn } from "@/lib/utils";

export function RevenueWaterfall({ className }: { className?: string }) {
  const max = OBSERVED_FAN_VALUE.total;
  const showPct = (OBSERVED_FAN_VALUE.showNight / max) * 100;
  const postPct = (OBSERVED_FAN_VALUE.postShow / max) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <ClaimLabel kind="demo" />
        <p className="text-xs text-muted-foreground">Seeded Detroit demo story</p>
      </div>
      <div className="deck-card rounded-2xl border-white/10 bg-[#161618] p-6">
        <div className="flex h-48 items-end gap-3 sm:gap-4">
          <WaterfallBar
            label="Show night"
            value={`$${OBSERVED_FAN_VALUE.showNight}`}
            heightPct={showPct}
            className="bg-primary/80"
          />
          <WaterfallBar
            label="Post-show"
            value={`+$${OBSERVED_FAN_VALUE.postShow}`}
            heightPct={postPct}
            className="bg-[#D8FF3E]/80"
            offset
          />
          <WaterfallBar
            label="Observed fan value"
            value={`$${OBSERVED_FAN_VALUE.total}`}
            heightPct={100}
            className="bg-gradient-to-t from-primary/40 to-primary/90"
            featured
          />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Show-night and post-show commerce attributed to the same verified attendance — not a
          predictive LTV model.
        </p>
      </div>
    </div>
  );
}

function WaterfallBar({
  label,
  value,
  heightPct,
  className,
  featured = false,
  offset = false,
}: {
  label: string;
  value: string;
  heightPct: number;
  className?: string;
  featured?: boolean;
  offset?: boolean;
}) {
  return (
    <div className={cn("flex flex-1 flex-col justify-end", offset && "mt-auto")}>
      <p className="mb-2 text-center font-display text-xl tabular sm:text-2xl">{value}</p>
      <div
        className={cn(
          "relative w-full rounded-t-lg transition-all duration-700",
          featured ? "ring-1 ring-primary/40" : "",
          className,
        )}
        style={{ height: `${Math.max(heightPct, 18)}%` }}
      />
      <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

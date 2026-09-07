import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface RelationshipFunnelMetrics {
  attendees: number;
  connectedFans: number;
  purchasingFans: number;
  repeatPurchasers: number;
}

function FunnelStage({
  label,
  value,
  width,
  isLast = false,
}: {
  label: string;
  value: number;
  width: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "flex min-h-[3.25rem] items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 px-4 py-3 text-center transition-all",
          width,
        )}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
            {label}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{value.toLocaleString("en-US")}</p>
        </div>
      </div>
      {!isLast ? (
        <span className="my-1 text-lg text-muted-foreground/60" aria-hidden>
          ↓
        </span>
      ) : null}
    </div>
  );
}

export function RelationshipFunnel({ metrics }: { metrics: RelationshipFunnelMetrics }) {
  const max = Math.max(metrics.attendees, 1);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Relationship funnel
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          From verified attendees to repeat purchasers — attributed to this show.
        </p>
      </div>

      <div className="mx-auto flex max-w-md flex-col items-center py-2">
        <FunnelStage
          label="Attendees"
          value={metrics.attendees}
          width="w-full max-w-[20rem]"
        />
        <FunnelStage
          label="Connected fans"
          value={metrics.connectedFans}
          width={cn("w-full", metrics.connectedFans / max > 0.75 ? "max-w-[18rem]" : "max-w-[16rem]")}
        />
        <FunnelStage
          label="Purchasing fans"
          value={metrics.purchasingFans}
          width={cn("w-full", metrics.purchasingFans / max > 0.5 ? "max-w-[15rem]" : "max-w-[13rem]")}
        />
        <FunnelStage
          label="Repeat purchasers"
          value={metrics.repeatPurchasers}
          width={cn("w-full", metrics.repeatPurchasers / max > 0.35 ? "max-w-[12rem]" : "max-w-[10rem]")}
          isLast
        />
      </div>

      {metrics.attendees > 0 && metrics.purchasingFans > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          {Math.round((metrics.purchasingFans / metrics.attendees) * 100)}% of verified attendees
          made at least one attributed purchase at this show.
        </p>
      ) : null}
    </section>
  );
}

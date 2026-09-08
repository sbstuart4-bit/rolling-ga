import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  cohortStageLabel,
  type CohortFunnelStage,
} from "@/lib/relationship-intelligence/types";
import { cohortMembersHref } from "@/lib/relationship-intelligence/cohorts";
import type { CohortFunnelCounts } from "@/lib/relationship-intelligence/types";

export interface RelationshipFunnelMetrics extends CohortFunnelCounts {}

function FunnelStage({
  label,
  value,
  width,
  href,
  active,
  isLast = false,
}: {
  label: string;
  value: number;
  width: string;
  href: string;
  active?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <Link
        href={href}
        className={cn(
          "flex min-h-[3.25rem] w-full items-center justify-center rounded-lg border px-4 py-3 text-center transition-all hover:border-violet-500/50 hover:bg-violet-500/15",
          active
            ? "border-violet-500/60 bg-violet-500/20 ring-1 ring-violet-500/30"
            : "border-violet-500/25 bg-violet-500/10",
          width,
        )}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
            {label}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{value.toLocaleString("en-US")}</p>
          <p className="mt-1 text-[10px] text-violet-200/70">View fans →</p>
        </div>
      </Link>
      {!isLast ? (
        <span className="my-1 text-lg text-muted-foreground/60" aria-hidden>↓</span>
      ) : null}
    </div>
  );
}

export function RelationshipFunnel({
  eventId,
  metrics,
  activeStage,
}: {
  eventId: string;
  metrics: RelationshipFunnelMetrics;
  activeStage?: CohortFunnelStage | null;
}) {
  const max = Math.max(metrics.attendees, 1);
  const stages: { key: CohortFunnelStage; value: number; width: string }[] = [
    { key: "attendees", value: metrics.attendees, width: "w-full max-w-[20rem]" },
    {
      key: "connected",
      value: metrics.connectedFans,
      width: cn("w-full", metrics.connectedFans / max > 0.75 ? "max-w-[18rem]" : "max-w-[16rem]"),
    },
    {
      key: "purchasing",
      value: metrics.purchasingFans,
      width: cn("w-full", metrics.purchasingFans / max > 0.5 ? "max-w-[15rem]" : "max-w-[13rem]"),
    },
    {
      key: "post_show",
      value: metrics.postShowPurchasers,
      width: cn("w-full", metrics.postShowPurchasers / max > 0.4 ? "max-w-[14rem]" : "max-w-[12rem]"),
    },
    {
      key: "repeat",
      value: metrics.repeatPurchasers,
      width: cn("w-full", metrics.repeatPurchasers / max > 0.35 ? "max-w-[12rem]" : "max-w-[10rem]"),
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Relationship funnel
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          From verified attendees to repeat purchasers — tap a stage to see the fans behind it.
        </p>
      </div>

      <div className="mx-auto flex max-w-md flex-col items-center py-2">
        {stages.map((stage, index) => (
          <FunnelStage
            key={stage.key}
            label={cohortStageLabel(stage.key)}
            value={stage.value}
            width={stage.width}
            href={cohortMembersHref(eventId, stage.key)}
            active={activeStage === stage.key}
            isLast={index === stages.length - 1}
          />
        ))}
      </div>

      {metrics.attendees > 0 && metrics.purchasingFans > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          {Math.round((metrics.purchasingFans / metrics.attendees) * 100)}% of verified attendees
          became connected purchasing fans at this show.
        </p>
      ) : null}
    </section>
  );
}

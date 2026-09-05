import { ClaimLabel } from "@/components/marketing/claim-label";
import { COHORT_METRICS, OBSERVED_FAN_VALUE } from "@/components/marketing/marketing-fixtures";
import { DeckStat } from "@/components/marketing/visual/deck-stat";
import { RevenueWaterfall } from "@/components/marketing/visual/revenue-waterfall";
import { ScrollReveal } from "@/components/marketing/visual/scroll-reveal";
import { cn } from "@/lib/utils";

const SPARK_HEIGHTS = [42, 68, 55, 72, 48, 80];

export function ObservedValueBlock() {
  return (
    <div className="space-y-10">
      <RevenueWaterfall />

      <ScrollReveal>
        <dl className="grid gap-4 sm:grid-cols-3">
          <DeckStat value={`$${OBSERVED_FAN_VALUE.showNight}`} label="Show night" />
          <DeckStat value={`+$${OBSERVED_FAN_VALUE.postShow}`} label="Post-show" featured />
          <DeckStat
            value={`$${OBSERVED_FAN_VALUE.total}`}
            label="Observed fan value"
            featured
            trailing={<ClaimLabel kind="demo" />}
          />
        </dl>
      </ScrollReveal>

      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Rolling GA separates show-night commerce from provably attributed post-show commerce so
        artists can measure what their verified audience actually generates. This is historical
        commerce tied to verified attendance — not a predictive LTV model.
      </p>

      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <p className="eyebrow text-muted-foreground">Cohort metrics</p>
          <ClaimLabel kind="illustrative" />
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COHORT_METRICS.map((metric, index) => (
            <ScrollReveal key={metric.label} delay={index * 40}>
              <li className="deck-card rounded-xl border-white/8 bg-[#161618] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{metric.label}</p>
                <p className="mt-1 font-display text-2xl tabular">{metric.value}</p>
                <SparkBar height={SPARK_HEIGHTS[index % SPARK_HEIGHTS.length] ?? 50} />
              </li>
            </ScrollReveal>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SparkBar({ height }: { height: number }) {
  return (
    <div className="mt-3 flex h-8 items-end gap-0.5" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "flex-1 rounded-sm bg-primary/30",
            i === 5 ? "bg-primary/80" : "",
          )}
          style={{ height: `${Math.max(20, height - Math.abs(i - 5) * 8)}%` }}
        />
      ))}
    </div>
  );
}

import { ClaimLabel } from "@/components/marketing/claim-label";
import { COHORT_METRICS, OBSERVED_FAN_VALUE } from "@/components/marketing/marketing-fixtures";

/**
 * One fan's observed value, then the cohort metrics behind it.
 *
 * Set as type on rules rather than as stat cards: the numbers are a worked demo
 * example, and dressing them as a dashboard implies a track record we do not
 * have. The arithmetic is shown in one line so the split between show-night and
 * attributed post-show commerce is the point, not the styling.
 */
export function ObservedValueBlock() {
  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-4 border-t border-world-rule pt-8">
        <Figure amount={`$${OBSERVED_FAN_VALUE.showNight}`} label="Show night" />
        <span aria-hidden className="mk-display text-3xl text-world-muted md:text-5xl">
          +
        </span>
        <Figure amount={`$${OBSERVED_FAN_VALUE.postShow}`} label="Post-show" />
        <span aria-hidden className="mk-display text-3xl text-world-muted md:text-5xl">
          =
        </span>
        <Figure
          amount={`$${OBSERVED_FAN_VALUE.total}`}
          label="Observed fan value"
          trailing={<ClaimLabel kind="demo" />}
        />
      </div>

      <p className="mk-body mt-10 max-w-2xl text-base leading-relaxed text-world-muted">
        Show-night commerce is separated from provably attributed post-show commerce, so the number
        describes what a verified audience actually generated. It is historical commerce tied to
        verified attendance &mdash; not a predictive lifetime-value model.
      </p>

      <div className="mt-20">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <p className="mk-kicker text-world-muted">Cohort metrics</p>
          <ClaimLabel kind="illustrative" />
        </div>
        <dl className="grid gap-x-14 sm:grid-cols-2 lg:grid-cols-3">
          {COHORT_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="flex items-baseline justify-between gap-6 border-t border-world-rule py-5"
            >
              <dt className="mk-kicker text-world-muted">{metric.label}</dt>
              <dd className="mk-display text-2xl tabular-nums">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function Figure({
  amount,
  label,
  trailing,
}: {
  amount: string;
  label: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <p className="mk-display mk-display-tight text-[clamp(2.5rem,6vw,5rem)] tabular-nums">
        {amount}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <p className="mk-kicker text-world-muted">{label}</p>
        {trailing}
      </div>
    </div>
  );
}

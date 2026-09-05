import { formatMoney } from "@/lib/format";
import type { MetricAvailability } from "@/lib/insights-economics";
import type { PilotInsightsSnapshot } from "@/server/studio/insights-queries";

export function PilotDashboard({ pilot }: { pilot: PilotInsightsSnapshot }) {
  return (
    <div className="space-y-10">
      {pilot.isDemoData && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
          Demo — pilot metrics use seeded demonstration data.
        </div>
      )}

      <header>
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-violet-400">
          Rolling GA Pilot
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          {pilot.artistName}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">1 artist · {pilot.shows.length} shows</p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-zinc-800 text-[10px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Show</th>
              <th className="px-4 py-3">Attendance</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3">Rolling GA GMV</th>
              <th className="px-4 py-3">GMV / att.</th>
              <th className="px-4 py-3">Contrib / att.</th>
              <th className="px-4 py-3">AOV</th>
              <th className="px-4 py-3">Digital</th>
              <th className="px-4 py-3">Ship subsidy</th>
              <th className="px-4 py-3">Consent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {pilot.shows.map((show) => (
              <tr key={show.eventId}>
                <td className="px-4 py-3 font-medium">{show.venueCity}</td>
                <td className="px-4 py-3 tabular">{show.attendance}</td>
                <td className="px-4 py-3 tabular">{show.verifiedFans}</td>
                <td className="px-4 py-3 tabular">{formatMoney(show.rollingGaGmvCents)}</td>
                <td className="px-4 py-3 tabular">{formatMetricMoney(show.gmvPerAttendee)}</td>
                <td className="px-4 py-3 tabular">{formatMetricMoney(show.contributionPerAttendee)}</td>
                <td className="px-4 py-3 tabular">{formatMoney(show.aovCents)}</td>
                <td className="px-4 py-3 tabular">{formatMoney(show.digitalOnlyCents)}</td>
                <td className="px-4 py-3 tabular">{formatMoney(show.shippingSubsidyCents)}</td>
                <td className="px-4 py-3 tabular">{formatMetricRatio(show.consentRate)}</td>
              </tr>
            ))}
            <tr className="bg-violet-500/5 font-semibold">
              <td className="px-4 py-3">Pilot total</td>
              <td className="px-4 py-3 tabular">{pilot.totals.attendance}</td>
              <td className="px-4 py-3 tabular">{pilot.totals.verifiedFans}</td>
              <td className="px-4 py-3 tabular">{formatMoney(pilot.totals.rollingGaGmvCents)}</td>
              <td className="px-4 py-3 tabular">{formatMetricMoney(pilot.totals.gmvPerAttendee)}</td>
              <td className="px-4 py-3 tabular">{formatMetricMoney(pilot.totals.contributionPerAttendee)}</td>
              <td className="px-4 py-3 tabular">—</td>
              <td className="px-4 py-3 tabular">{formatMoney(pilot.totals.digitalOnlyCents)}</td>
              <td className="px-4 py-3 tabular">{formatMoney(pilot.totals.shippingSubsidyCents)}</td>
              <td className="px-4 py-3 tabular">—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/30 px-5 py-8 text-center">
        <p className="font-medium text-zinc-300">Physical merch baseline not connected</p>
        <p className="mt-2 text-sm text-zinc-500">
          Baseline vs With Rolling GA vs Incremental requires POS import. Not fabricated.
        </p>
        <p className="mt-3 text-xs uppercase tracking-wide text-zinc-600">Requires baseline</p>
      </div>
    </div>
  );
}

function formatMetricMoney(metric: MetricAvailability): string {
  if (metric.status === "available") return formatMoney(metric.value);
  if (metric.status === "incomplete") return "Incomplete";
  return "—";
}

function formatMetricRatio(metric: MetricAvailability): string {
  if (metric.status === "available") return `${(metric.value * 100).toFixed(1)}%`;
  if (metric.status === "incomplete") return "Incomplete";
  return "—";
}

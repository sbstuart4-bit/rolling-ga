import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { FansMetricsHeader } from "@/components/studio/fan-relationship-ui";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { listEventsForArtist } from "@/server/events/queries";
import {
  listConsentedFansWithValue,
  loadFanRelationshipMetrics,
} from "@/server/studio/fan-relationship-queries";
import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import { formatEventDateShort, formatMoney, initialsOf } from "@/lib/format";

export const metadata: Metadata = { title: "Fans — Artist Studio" };

/**
 * Verified fan relationships — only fans who explicitly consented are visible.
 * Attendance alone does not grant access to fan-level detail.
 */
export default async function StudioFansPage() {
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/fans");
  const artistId = defaultArtistId(ctx);

  if (!artistId) return <div className="p-6 text-muted-foreground">Select an artist.</div>;

  const [metrics, fans, events] = await Promise.all([
    loadFanRelationshipMetrics(ctx, artistId),
    listConsentedFansWithValue(ctx, artistId),
    listEventsForArtist(artistId),
  ]);

  const pastEvents = events.filter((e) => e.endsAt.getTime() < Date.now());
  const defaultCohortEvent =
    pastEvents.find((e) => e.id === MARISOL_BROOKLYN_EVENT_ID) ??
    pastEvents.find((e) => e.venueCity === "Brooklyn") ??
    pastEvents[0];
  const cohortHref = defaultCohortEvent
    ? `/studio/fans/cohort/${defaultCohortEvent.id}`
    : undefined;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verified fan relationships</h1>
        <p className="text-sm text-muted-foreground">
          Permissioned fans who opted in to connect — attendance alone does not appear here.
        </p>
      </div>

      <FansMetricsHeader metrics={metrics} cohortHref={cohortHref} />

      {fans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-20 text-center">
          <Users className="mx-auto mb-3 size-8 text-muted-foreground/40" aria-hidden />
          <p className="font-semibold">No consented fans yet</p>
          <p className="mt-1 text-sm text-muted-foreground text-balance max-w-xs mx-auto">
            Fans who attend your shows and opt into artist connection will appear here.
          </p>
        </div>
      ) : (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Connected fans
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Fan</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Shows</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Observed GMV</th>
                <th className="pb-2 font-medium text-muted-foreground">Connected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fans.map((fan) => (
                <tr key={fan.userId} className="group">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/studio/fans/${fan.userId}`}
                      className="flex items-center gap-3 hover:opacity-80"
                    >
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold"
                        aria-hidden
                      >
                        {initialsOf(fan.displayName)}
                      </div>
                      <div>
                        <p className="font-medium group-hover:underline">{fan.displayName}</p>
                        <p className="text-xs text-muted-foreground">{fan.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-muted-foreground">
                    {fan.showsAttended}
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{formatMoney(fan.observedGmvCents)}</td>
                  <td className="py-3 text-muted-foreground">
                    {fan.grantedAt?.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

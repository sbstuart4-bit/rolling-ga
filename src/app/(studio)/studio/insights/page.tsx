import type { Metadata } from "next";
import { ArtistGuidedDemoHighlight } from "@/components/demo/artist-guided-demo-highlight";
import { InsightsDashboard } from "@/components/studio/insights-dashboard";
import { EventInsightsPicker } from "@/components/studio/event-insights-picker";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { loadInsightsOverview } from "@/server/studio/insights-queries";

export const metadata: Metadata = { title: "Insights — Artist Studio" };

export default async function StudioInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventParam } = await searchParams;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/insights");
  const artistId = defaultArtistId(ctx);

  if (!artistId) {
    return <div className="text-muted-foreground">Select an artist.</div>;
  }

  const overview = await loadInsightsOverview(ctx, artistId, eventParam ?? null);
  if (!overview?.snapshot) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="font-semibold">No show data yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Insights appear once you have verified attendance and paid orders.
        </p>
      </div>
    );
  }

  const { snapshot, pilotEventIds, allEvents } = overview;
  const pilotQuery = pilotEventIds.join(",");

  return (
    <div className="rounded-2xl bg-zinc-950 p-6 text-white lg:p-8">
      <ArtistGuidedDemoHighlight />
      <InsightsDashboard
        snapshot={snapshot}
        pilotHref={`/studio/insights/pilot?events=${pilotQuery}`}
        eventPicker={
          allEvents.length > 1 ? (
            <EventInsightsPicker
              events={allEvents}
              currentEventId={snapshot.event.id}
            />
          ) : undefined
        }
      />
    </div>
  );
}

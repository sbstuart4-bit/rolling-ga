import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtistGuidedDemoHighlight } from "@/components/demo/artist-guided-demo-highlight";
import { FanCohortDashboard } from "@/components/studio/fan-cohort-dashboard";
import { ShowCohortPicker } from "@/components/studio/show-cohort-picker";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { listEventsForArtist } from "@/server/events/queries";
import { loadShowCohortMetrics } from "@/server/studio/fan-relationship-queries";

export const metadata: Metadata = { title: "Show cohort value — Artist Studio" };

export default async function StudioFanCohortPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const ctx = await requireAuthWithRole(
    ["artist_member", "rga_admin"],
    `/studio/fans/cohort/${eventId}`,
  );
  const artistId = defaultArtistId(ctx);

  if (!artistId) return <div className="p-6 text-muted-foreground">Select an artist.</div>;

  const [cohort, events] = await Promise.all([
    loadShowCohortMetrics(ctx, artistId, eventId),
    listEventsForArtist(artistId),
  ]);

  if (!cohort) notFound();

  const pickerEvents = events
    .filter((e) => e.endsAt.getTime() < Date.now())
    .map((e) => ({
      id: e.id,
      venueCity: e.venueCity,
      startsAt: e.startsAt,
      timezone: e.timezone,
    }));

  return (
    <div className="p-6">
      <ArtistGuidedDemoHighlight />
      <FanCohortDashboard
        cohort={cohort}
        eventPicker={
          pickerEvents.length > 1 ? (
            <ShowCohortPicker events={pickerEvents} currentEventId={eventId} />
          ) : undefined
        }
      />
    </div>
  );
}

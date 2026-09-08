import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtistGuidedDemoHighlight } from "@/components/demo/artist-guided-demo-highlight";
import { FanCohortDashboard } from "@/components/studio/fan-cohort-dashboard";
import { ShowCohortPicker } from "@/components/studio/show-cohort-picker";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { listEventsForArtist } from "@/server/events/queries";
import { loadShowCohortDetail } from "@/server/studio/fan-relationship-queries";
import { listActivationsForEvent } from "@/server/activation/queries";

export const metadata: Metadata = { title: "Show cohort — Artist Studio" };

export default async function StudioFanCohortPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ stage?: string }>;
}) {
  const { eventId } = await params;
  const { stage } = await searchParams;
  const ctx = await requireAuthWithRole(
    ["artist_member", "rga_admin"],
    `/studio/fans/cohort/${eventId}`,
  );
  const artistId = defaultArtistId(ctx);

  if (!artistId) return <div className="p-6 text-muted-foreground">Select an artist.</div>;

  const [cohort, events, activations] = await Promise.all([
    loadShowCohortDetail(ctx, artistId, eventId, stage),
    listEventsForArtist(artistId),
    listActivationsForEvent(artistId, eventId),
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
        activations={activations}
        eventPicker={
          pickerEvents.length > 1 ? (
            <ShowCohortPicker events={pickerEvents} currentEventId={eventId} />
          ) : undefined
        }
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ShowConfigEditor } from "@/components/studio/show-config-editor";
import { ShowFanPreview } from "@/components/studio/show-fan-preview";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { listEventsForTour } from "@/server/events/queries";
import { loadEventConfigBundle } from "@/server/studio/tour-queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tourId: string; eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  return { title: `Show ${eventId} — Artist Studio` };
}

export default async function StudioShowConfigPage({
  params,
}: {
  params: Promise<{ tourId: string; eventId: string }>;
}) {
  const { tourId, eventId } = await params;
  const ctx = await requireAuthWithRole(
    ["artist_member", "rga_admin"],
    `/studio/tour/${tourId}/events/${eventId}`,
  );
  const artistId = defaultArtistId(ctx);

  if (!artistId) notFound();

  const bundle = await loadEventConfigBundle(ctx, artistId, eventId);
  if (!bundle || bundle.tour.id !== tourId) notFound();

  const allEvents = await listEventsForTour(tourId);
  const otherEvents = allEvents
    .filter((row) => row.id !== eventId)
    .map((row) => ({ id: row.id, venueCity: row.venueCity }));

  const { event, override, resolvedTheme, timing } = bundle;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href={`/studio/tour/${tourId}`}>
          <ArrowLeft className="size-4" aria-hidden />
          Back to tour
        </Link>
      </Button>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <ShowConfigEditor
          artistId={artistId}
          tourId={tourId}
          eventId={eventId}
          event={{
            localMessage: event.localMessage,
            postShowWindowMinutes: event.postShowWindowMinutes,
            venueCity: event.venueCity,
          }}
          override={
            override
              ? {
                  cityArtworkUrl: override.cityArtworkUrl,
                  heroImageUrl: override.heroImageUrl,
                  showMessaging: override.showMessaging,
                  accent: override.accent,
                }
              : null
          }
          resolvedTheme={resolvedTheme}
          otherEvents={otherEvents}
        />

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <ShowFanPreview event={event} theme={resolvedTheme} timing={timing} />
        </aside>
      </div>
    </div>
  );
}

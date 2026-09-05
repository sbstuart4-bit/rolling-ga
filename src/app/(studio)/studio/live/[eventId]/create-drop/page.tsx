import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CreateLiveDropForm } from "@/components/studio/create-live-drop-form";
import { Button } from "@/components/ui/button";
import { heroImageFor } from "@/lib/theme";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { listEligibleProductsForEventDrop } from "@/server/catalog/queries";
import { getEventById } from "@/server/events/queries";
import { resolveEventTheme } from "@/server/theme/resolve";
import { computeDropEndTime } from "@/server/studio/live";
import { demoNow } from "@/server/demo/clock";

export const metadata: Metadata = { title: "Create Drop — Artist Studio" };

export default async function StudioCreateDropPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const ctx = await requireAuthWithRole(
    ["artist_member", "rga_admin"],
    `/studio/live/${eventId}/create-drop`,
  );
  const artistId = defaultArtistId(ctx);
  if (!artistId) notFound();

  const event = await getEventById(eventId);
  if (!event || event.artistId !== artistId) notFound();

  const [products, theme] = await Promise.all([
    listEligibleProductsForEventDrop(artistId, eventId),
    resolveEventTheme(eventId),
  ]);

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href={`/studio/live/${eventId}`}>
            <ArrowLeft className="size-4" aria-hidden />
            Back to command center
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Create drop</h1>
        <p className="text-muted-foreground">
          No eligible merchandise products are configured for this show yet.
        </p>
      </div>
    );
  }

  const defaultEndsAt = computeDropEndTime({
    startsAt: demoNow(),
    durationMode: "minutes",
    durationMinutes: 45,
    event: {
      endsAt: event.endsAt,
      postShowWindowMinutes: event.postShowWindowMinutes,
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href={`/studio/live/${eventId}`}>
            <ArrowLeft className="size-4" aria-hidden />
            Back to command center
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Create drop</h1>
        <p className="text-sm text-muted-foreground">
          Launch to verified attendees at {event.venueCity}. Fans will see this in the event shop under
          the artist takeover theme.
        </p>
      </div>

      <CreateLiveDropForm
        artistId={artistId}
        eventId={eventId}
        city={event.venueCity}
        theme={theme}
        heroImage={heroImageFor(theme)}
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          basePriceCents: product.basePriceCents,
          images: product.images,
        }))}
        defaultEndsAtIso={defaultEndsAt.toISOString()}
      />
    </div>
  );
}

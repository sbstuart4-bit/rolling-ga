import type { Metadata } from "next";
import { ArtistGuidedDemoHighlight } from "@/components/demo/artist-guided-demo-highlight";
import { FulfillmentCommandCenter } from "@/components/studio/fulfillment-command-center";
import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import {
  loadArtistFulfillmentEvents,
  loadShowFulfillmentSnapshot,
} from "@/server/studio/fulfillment-queries";

export const metadata: Metadata = { title: "Orders — Artist Studio" };

export default async function StudioOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; guided?: string; step?: string; presenter?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/orders");
  const artistId = defaultArtistId(ctx);

  if (!artistId) {
    return <div className="p-6 text-muted-foreground">Select an artist.</div>;
  }

  const events = await loadArtistFulfillmentEvents(ctx, artistId);
  if (events.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-4 text-muted-foreground">No fulfillment orders yet.</p>
      </div>
    );
  }

  const eventId =
    params.event && events.some((e) => e.id === params.event)
      ? params.event
      : events.find((e) => e.id === MARISOL_BROOKLYN_EVENT_ID)?.id ?? events[0]!.id;

  const snapshot = await loadShowFulfillmentSnapshot(ctx, artistId, eventId);
  if (!snapshot) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-4 text-muted-foreground">Fulfillment data unavailable for this show.</p>
      </div>
    );
  }

  const guidedQuery = [
    params.guided ? `guided=${params.guided}` : null,
    params.step ? `step=${params.step}` : null,
    params.presenter ? `presenter=${params.presenter}` : null,
  ]
    .filter(Boolean)
    .join("&");

  return (
    <div className="p-6">
      <ArtistGuidedDemoHighlight />
      <FulfillmentCommandCenter
        snapshot={snapshot}
        events={events}
        guidedQuery={guidedQuery || undefined}
      />
    </div>
  );
}

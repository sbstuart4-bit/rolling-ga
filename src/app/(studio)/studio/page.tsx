import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { resolvePrimaryLiveEventId } from "@/server/studio/live";

export const metadata: Metadata = { title: "Live — Artist Studio" };

export default async function StudioHomePage() {
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio");
  const artistId = defaultArtistId(ctx);

  if (!artistId) {
    return (
      <div className="p-6 text-muted-foreground">
        Select an artist to open the Live Command Center.
      </div>
    );
  }

  const eventId = await resolvePrimaryLiveEventId(artistId);
  if (!eventId) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Live Command Center</h1>
        <p className="text-muted-foreground">No live or upcoming shows for this artist.</p>
      </div>
    );
  }

  redirect(`/studio/live/${eventId}`);
}

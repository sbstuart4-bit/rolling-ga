import type { Metadata } from "next";
import { ArtistGuidedDemoHighlight } from "@/components/demo/artist-guided-demo-highlight";
import { ShowEconomicsDashboard } from "@/components/studio/show-economics-dashboard";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { loadShowEconomicsSnapshot } from "@/server/studio/show-economics-queries";

export const metadata: Metadata = { title: "Show economics — Artist Studio" };

export default async function ShowEconomicsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/insights");
  const artistId = defaultArtistId(ctx);

  if (!artistId) {
    return <div className="text-muted-foreground">Select an artist.</div>;
  }

  const snapshot = await loadShowEconomicsSnapshot(ctx, artistId, eventId);
  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="font-semibold">Show economics unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This show was not found or you do not have access.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-zinc-950 p-6 text-white lg:p-8">
      <ArtistGuidedDemoHighlight />
      <ShowEconomicsDashboard
        snapshot={snapshot}
        backHref={`/studio/insights?event=${eventId}`}
      />
    </div>
  );
}

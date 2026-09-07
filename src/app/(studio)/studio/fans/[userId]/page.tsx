import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArtistGuidedDemoHighlight } from "@/components/demo/artist-guided-demo-highlight";
import { FanRelationshipProfileView } from "@/components/studio/fan-relationship-profile";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { loadFanRelationshipProfile } from "@/server/studio/fan-relationship-queries";

export const metadata: Metadata = { title: "Fan relationship — Artist Studio" };

export default async function StudioFanProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], `/studio/fans/${userId}`);
  const artistId = defaultArtistId(ctx);

  if (!artistId) return <div className="p-6 text-muted-foreground">Select an artist.</div>;

  const profile = await loadFanRelationshipProfile(ctx, artistId, userId);
  if (!profile) notFound();

  return (
    <div className="p-6">
      <ArtistGuidedDemoHighlight />
      <FanRelationshipProfileView profile={profile} />
    </div>
  );
}

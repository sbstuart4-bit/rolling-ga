import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ArtistGuidedDemoHighlight } from "@/components/demo/artist-guided-demo-highlight";
import { LiveCommandCenter } from "@/components/studio/live-command-center";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { loadLiveCommandCenterSnapshot } from "@/server/studio/live";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Live Command Center — Artist Studio" };
}

export default async function StudioLiveEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ launched?: string }>;
}) {
  const { eventId } = await params;
  const { launched } = await searchParams;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], `/studio/live/${eventId}`);
  const artistId = defaultArtistId(ctx);

  if (!artistId) notFound();

  const snapshot = await loadLiveCommandCenterSnapshot(ctx, artistId, eventId);
  if (!snapshot) notFound();

  const launchedDropId = typeof launched === "string" ? launched : null;

  return (
    <div className="space-y-4">
      <ArtistGuidedDemoHighlight />
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/studio">
          <ArrowLeft className="size-4" aria-hidden />
          All shows
        </Link>
      </Button>
      <LiveCommandCenter snapshot={snapshot} launchedDropId={launchedDropId} />
    </div>
  );
}

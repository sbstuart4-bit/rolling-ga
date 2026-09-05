import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AddShowForm } from "@/components/studio/add-show-form";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { listVenuesForStudio, requireTourForArtist } from "@/server/studio/tour-queries";

export const metadata: Metadata = { title: "Add show — Artist Studio" };

export default async function StudioAddShowPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const ctx = await requireAuthWithRole(
    ["artist_member", "rga_admin"],
    `/studio/tour/${tourId}/events/new`,
  );
  const artistId = defaultArtistId(ctx);

  if (!artistId) notFound();

  const tour = await requireTourForArtist(tourId, artistId);
  if (!tour) notFound();

  const venues = await listVenuesForStudio();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href={`/studio/tour/${tourId}`}>
          <ArrowLeft className="size-4" aria-hidden />
          Back to {tour.name}
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add show</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          New shows inherit tour defaults automatically.
        </p>
      </div>

      <AddShowForm artistId={artistId} tourId={tourId} venues={venues} />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TourDefaultsForm } from "@/components/studio/tour-defaults-form";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { requireTourForArtist } from "@/server/studio/tour-queries";

export const metadata: Metadata = { title: "Tour defaults — Artist Studio" };

export default async function StudioTourDefaultsPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const ctx = await requireAuthWithRole(
    ["artist_member", "rga_admin"],
    `/studio/tour/${tourId}/defaults`,
  );
  const artistId = defaultArtistId(ctx);

  if (!artistId) notFound();

  const tour = await requireTourForArtist(tourId, artistId);
  if (!tour) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href={`/studio/tour/${tourId}`}>
          <ArrowLeft className="size-4" aria-hidden />
          Back to tour
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tour defaults</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Settings here inherit to every show on {tour.name}. Individual cities can override
          anything that differs.
        </p>
      </div>

      <TourDefaultsForm artistId={artistId} tour={tour} />
    </div>
  );
}

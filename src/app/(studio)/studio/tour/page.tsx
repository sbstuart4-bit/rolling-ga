import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { listArtistTours } from "@/server/artists/queries";
import { resolvePrimaryTourId } from "@/server/studio/tour-queries";

export const metadata: Metadata = { title: "Tour — Artist Studio" };

export default async function StudioTourPage() {
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/tour");
  const artistId = defaultArtistId(ctx);

  if (!artistId) {
    return <div className="p-6 text-muted-foreground">Select an artist.</div>;
  }

  const tours = await listArtistTours(ctx, artistId);

  if (tours.length === 1) {
    redirect(`/studio/tour/${tours[0]!.id}`);
  }

  const primaryTourId = await resolvePrimaryTourId(artistId);
  if (tours.length > 1 && primaryTourId) {
    redirect(`/studio/tour/${primaryTourId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tour</h1>
          <p className="text-sm text-muted-foreground">Configure tours and shows for your artist.</p>
        </div>
        <Button asChild>
          <Link href="/studio/tour/new">
            <Plus className="size-4" aria-hidden />
            New tour
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-20 text-center">
        <p className="font-semibold">No tours yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Create a tour and start adding shows.</p>
        <Button asChild className="mt-4">
          <Link href="/studio/tour/new">Create tour</Link>
        </Button>
      </div>
    </div>
  );
}

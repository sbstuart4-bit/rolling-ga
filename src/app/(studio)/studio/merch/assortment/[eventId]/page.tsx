import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ShowAssortmentView } from "@/components/studio/show-assortment-view";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { loadShowAssortment } from "@/server/studio/merch-queries";

export const metadata: Metadata = { title: "Show assortment — Artist Studio" };

export default async function StudioShowAssortmentPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const ctx = await requireAuthWithRole(
    ["artist_member", "rga_admin"],
    `/studio/merch/assortment/${eventId}`,
  );
  const artistId = defaultArtistId(ctx);

  if (!artistId) notFound();

  const assortment = await loadShowAssortment(ctx, artistId, eventId);
  if (!assortment) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/studio/merch">
          <ArrowLeft className="size-4" aria-hidden />
          Back to merch
        </Link>
      </Button>

      <ShowAssortmentView
        event={assortment.event}
        counts={assortment.counts}
        physicalCore={assortment.physicalCore}
        rollingGaExtended={assortment.rollingGaExtended}
        cityExclusives={assortment.cityExclusives}
        tourId={assortment.event.tourId}
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BundleForm } from "@/components/studio/bundle-form";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { listProductsForArtist } from "@/server/catalog/queries";
import {
  listEventsForMerchPicker,
  listToursForMerchPicker,
} from "@/server/studio/merch-queries";

export const metadata: Metadata = { title: "New bundle — Artist Studio" };

export default async function StudioNewBundlePage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId } = await searchParams;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/merch/bundles/new");
  const artistId = defaultArtistId(ctx);

  if (!artistId) return <div className="text-muted-foreground">Select an artist.</div>;

  const [products, events, tours] = await Promise.all([
    listProductsForArtist(artistId),
    listEventsForMerchPicker(artistId),
    listToursForMerchPicker(artistId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/studio/merch">
          <ArrowLeft className="size-4" aria-hidden />
          Back to merch
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New bundle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Combine products with bundle pricing — e.g. Complete Your Detroit Drop.
        </p>
      </div>

      <BundleForm
        artistId={artistId}
        products={products}
        events={events}
        tours={tours}
        defaultEventId={eventId}
      />
    </div>
  );
}

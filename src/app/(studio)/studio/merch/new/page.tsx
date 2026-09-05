import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/studio/product-form";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import {
  listEventsForMerchPicker,
  listToursForMerchPicker,
} from "@/server/studio/merch-queries";

export const metadata: Metadata = { title: "Add product — Artist Studio" };

export default async function StudioNewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ tourId?: string; eventId?: string; digital?: string }>;
}) {
  const { tourId, eventId, digital } = await searchParams;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/merch/new");
  const artistId = defaultArtistId(ctx);

  if (!artistId) return <div className="text-muted-foreground">Select an artist.</div>;

  const [tours, events] = await Promise.all([
    listToursForMerchPicker(artistId),
    listEventsForMerchPicker(artistId),
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
        <h1 className="text-2xl font-semibold tracking-tight">Add product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tour core, endless aisle, or show-specific — configure eligibility and inventory.
        </p>
      </div>

      <ProductForm
        artistId={artistId}
        tours={tours}
        events={events}
        defaults={{
          tourId,
          eventId,
          isDigital: digital === "1",
          accessType: eventId ? "event_specific" : undefined,
        }}
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import {
  EndlessAisleViz,
  MerchSectionPanel,
} from "@/components/studio/merch-product-card";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { loadMerchDashboard } from "@/server/studio/merch-queries";
import { resolvePrimaryTourId } from "@/server/studio/tour-queries";
import { listEventsForTour } from "@/server/events/queries";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Merch — Artist Studio" };

export default async function StudioMerchPage() {
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/merch");
  const artistId = defaultArtistId(ctx);

  if (!artistId) return <div className="text-muted-foreground">Select an artist.</div>;

  const tourId = await resolvePrimaryTourId(artistId);
  const events = tourId ? await listEventsForTour(tourId) : [];
  const primaryEventId = events[0]?.id ?? null;

  const dashboard = await loadMerchDashboard(ctx, artistId, primaryEventId);
  const { sections, bundles, assortmentPreview, primaryEvent } = dashboard;

  const activeCount = Object.entries(sections)
    .filter(([key]) => key !== "archive")
    .reduce((sum, [, items]) => sum + items.length, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Merch</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catalog, assortment, and endless aisle — {activeCount} active products
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/studio/merch/exclusive/new">
              <Sparkles className="size-4" aria-hidden />
              City exclusive
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/studio/merch/bundles/new">New bundle</Link>
          </Button>
          <Button asChild>
            <Link href="/studio/merch/new">
              <Plus className="size-4" aria-hidden />
              Add product
            </Link>
          </Button>
        </div>
      </div>

      {assortmentPreview && primaryEvent && (
        <div className="space-y-3">
          <EndlessAisleViz
            physicalCore={assortmentPreview.physicalCore}
            rollingGaExtended={assortmentPreview.rollingGaExtended}
            totalAvailable={assortmentPreview.totalAvailable}
            eventLabel={`Tonight: ${primaryEvent.venueCity}`}
          />
          <Button asChild variant="link" className="h-auto p-0 text-sm">
            <Link href={`/studio/merch/assortment/${primaryEvent.id}`}>
              Configure {primaryEvent.venueCity} assortment →
            </Link>
          </Button>
        </div>
      )}

      {bundles.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">Bundles</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {bundles.map((bundle) => (
              <li key={bundle.id}>
                <Link
                  href={`/studio/merch/bundles/${bundle.id}`}
                  className="block rounded-xl border border-border bg-card/40 px-4 py-3 hover:bg-card"
                >
                  <p className="font-medium">{bundle.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {bundle.itemCount} items · {formatMoney(bundle.bundlePriceCents)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-8 xl:grid-cols-2">
        <MerchSectionPanel section="tour_core" products={sections.tour_core} />
        <MerchSectionPanel section="endless_aisle" products={sections.endless_aisle} />
        <MerchSectionPanel section="city_exclusives" products={sections.city_exclusives} />
        <MerchSectionPanel section="premium" products={sections.premium} />
        <MerchSectionPanel section="vinyl_collectibles" products={sections.vinyl_collectibles} />
        <MerchSectionPanel section="archive" products={sections.archive} />
      </div>
    </div>
  );
}

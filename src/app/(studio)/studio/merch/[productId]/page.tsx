import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { AvailabilityBadge } from "@/components/studio/merch-product-card";
import { EditProductForm } from "@/components/studio/edit-product-form";
import { InventoryEditor } from "@/components/studio/inventory-editor";
import { ProductEconomicsPanel } from "@/components/studio/product-economics-panel";
import { ShowFanPreview } from "@/components/studio/show-fan-preview";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { PRODUCT_ACCESS_LABELS } from "@/lib/types";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import {
  getProductForStudio,
  listEventsForMerchPicker,
  listToursForMerchPicker,
} from "@/server/studio/merch-queries";
import { loadEventConfigBundle } from "@/server/studio/tour-queries";
import { archiveProductAction } from "@/server/studio/merch-actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  return { title: `Product ${productId} — Artist Studio` };
}

export default async function StudioProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], `/studio/merch/${productId}`);
  const artistId = defaultArtistId(ctx);

  if (!artistId) notFound();

  const detail = await getProductForStudio(ctx, artistId, productId);
  if (!detail) notFound();

  const [tours, events] = await Promise.all([
    listToursForMerchPicker(artistId),
    listEventsForMerchPicker(artistId),
  ]);

  const { product, variants, drops, economics, eventLabel } = detail;
  const image = product.images?.[0];

  const previewBundle =
    product.eventId != null
      ? await loadEventConfigBundle(ctx, artistId, product.eventId)
      : null;

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/studio/merch">
          <ArrowLeft className="size-4" aria-hidden />
          Back to merch
        </Link>
      </Button>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <header className="flex flex-wrap gap-6">
            <div className="relative size-32 shrink-0 overflow-hidden rounded-2xl bg-muted">
              {image ? (
                <Image src={image} alt="" fill className="object-cover" sizes="128px" />
              ) : (
                <Package className="absolute inset-0 m-auto size-10 text-muted-foreground/40" aria-hidden />
              )}
            </div>
            <div className="min-w-0 space-y-2">
              <h1 className="text-2xl font-semibold">{product.name}</h1>
              {product.tagline && <p className="text-muted-foreground">{product.tagline}</p>}
              <div className="flex flex-wrap gap-2">
                <AvailabilityBadge channel={product.availabilityChannel} />
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {PRODUCT_ACCESS_LABELS[product.accessType]}
                </span>
              </div>
              <dl className="flex flex-wrap gap-4 text-sm tabular">
                <div><dt className="text-muted-foreground">Price</dt><dd className="font-semibold">{formatMoney(product.basePriceCents)}</dd></div>
                <div><dt className="text-muted-foreground">SKU</dt><dd className="font-mono text-xs">{product.sku}</dd></div>
                {eventLabel && <div><dt className="text-muted-foreground">Show</dt><dd>{eventLabel}</dd></div>}
              </dl>
            </div>
          </header>

          <ProductEconomicsPanel economics={economics} />

          <section className="space-y-3">
            <h2 className="font-semibold">Inventory</h2>
            <InventoryEditor artistId={artistId} productId={productId} variants={variants} />
            <p className="text-xs text-muted-foreground tabular">
              Sold (all time): {product.totalSold} · Available: {product.isDigital ? "∞" : product.totalAvailable} · Reserved: {product.totalReserved}
            </p>
          </section>

          {drops.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-semibold">Current drops</h2>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {drops.map((drop) => (
                  <li key={drop.dropId} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span>{drop.dropTitle}</span>
                    <span className="text-muted-foreground">{drop.dropStatus}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <EditProductForm
            artistId={artistId}
            product={product}
            tours={tours}
            events={events}
          />

          {product.active && (
            <form action={archiveProductAction}>
              <input type="hidden" name="artistId" value={artistId} />
              <input type="hidden" name="productId" value={productId} />
              <Button type="submit" variant="outline" className="text-destructive">
                Archive product
              </Button>
            </form>
          )}
        </div>

        {previewBundle && (
          <aside className="xl:sticky xl:top-8 xl:self-start">
            <ShowFanPreview
              event={previewBundle.event}
              theme={previewBundle.resolvedTheme}
              timing={previewBundle.timing}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

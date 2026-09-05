import Link from "next/link";
import { Lock } from "lucide-react";
import { EventShopProductCard } from "@/components/fan/event-shop/event-shop-product-card";
import { eventShopProductTag } from "@/lib/event-shop-present";
import type { DropExclusivityType, ProductAccessType, ProductCategory } from "@/lib/types";

export interface LockedPreviewProduct {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  images?: string[] | null;
  priceCents: number;
  accessType?: ProductAccessType | null;
  category?: ProductCategory | null;
  artistId: string;
  dropExclusivity?: DropExclusivityType | null;
}

/**
 * Pre-show anticipation strip — locked products the fan can preview but not buy until verified.
 */
export function EventLockedMerchPreview({
  eventSlug,
  artistName,
  products,
  lockLabel = "Unlock at the show",
  previewMessage,
}: {
  eventSlug: string;
  artistName: string;
  products: LockedPreviewProduct[];
  lockLabel?: string;
  previewMessage?: string;
}) {
  if (products.length === 0) return null;

  const verifyHref = `/event/${eventSlug}/verify`;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-artist-border bg-artist-surface px-4 py-3">
        <p className="eyebrow text-artist-accent">Tonight&apos;s merchandise</p>
        <p className="mt-1 text-sm text-artist-muted">
          {previewMessage ??
            `Exclusive to verified attendees at ${artistName}'s show.`}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <li key={product.id}>
            <EventShopProductCard
              href={verifyHref}
              name={product.name}
              tagline={product.tagline}
              image={product.images?.[0]}
              priceCents={product.priceCents}
              tag={eventShopProductTag({
                dropExclusivity: product.dropExclusivity,
                accessType: product.accessType,
                category: product.category,
              })}
              locked
              lockLabel={lockLabel}
              actionLabel="Unlock"
            />
          </li>
        ))}
      </ul>

      <Link
        href={`/event/${eventSlug}/shop`}
        className="flex items-center justify-center gap-2 rounded-xl border border-artist-border bg-artist-surface px-4 py-3 text-sm font-medium text-artist-fg transition-colors hover:bg-artist-accent/10"
      >
        <Lock className="size-4 text-artist-muted" aria-hidden />
        Preview the full shop
      </Link>
    </section>
  );
}

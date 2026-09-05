import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { eventShopProductTag } from "@/lib/event-shop-present";
import type { DropExclusivityType, ProductAccessType, ProductCategory } from "@/lib/types";

export type EditorialProduct = {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  images?: string[] | null;
  priceCents: number;
  accessType?: ProductAccessType | null;
  category?: ProductCategory | null;
  href: string;
  locked?: boolean;
  lockLabel?: string;
  actionLabel?: string;
  metadataLabel?: string;
};

export function EditorialDropProducts({
  products,
  dropExclusivity,
  scoped = true,
}: {
  products: EditorialProduct[];
  dropExclusivity?: DropExclusivityType | null;
  scoped?: boolean;
}) {
  if (products.length === 0) return null;

  const [hero, ...rest] = products;
  const secondary = rest.slice(0, 2);
  const rows = rest.slice(2);

  return (
    <div className="space-y-4">
      <EditorialHeroProduct
        product={hero}
        tag={eventShopProductTag({
          dropExclusivity,
          accessType: hero.accessType,
          category: hero.category,
        })}
        scoped={scoped}
      />

      {secondary.length > 0 && (
        <ul className="grid grid-cols-2 gap-3">
          {secondary.map((product) => (
            <li key={product.id}>
              <EditorialSecondaryProduct
                product={product}
                tag={eventShopProductTag({
                  dropExclusivity,
                  accessType: product.accessType,
                  category: product.category,
                })}
                scoped={scoped}
              />
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((product) => (
            <li key={product.id}>
              <EditorialRowProduct product={product} scoped={scoped} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditorialHeroProduct({
  product,
  tag,
  scoped,
}: {
  product: EditorialProduct;
  tag?: string | null;
  scoped: boolean;
}) {
  return (
    <Link
      href={product.href}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border",
        scoped ? "border-artist-border" : "border-border",
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-artist-bg">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt=""
            fill
            sizes="(min-width: 768px) 672px, 100vw"
            className={cn(
              "object-contain p-2 transition-transform duration-500 group-hover:scale-[1.02]",
              product.locked && "opacity-80 saturate-[0.65]",
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-artist-muted">—</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
          {tag && (
            <span className="inline-flex rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
              {tag}
            </span>
          )}
          {product.metadataLabel && (
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">
              {product.metadataLabel}
            </p>
          )}
          <div className="flex items-end justify-between gap-3">
            <p className="font-artist text-2xl leading-none text-white">{product.name}</p>
            <p className="tabular shrink-0 text-xl font-semibold text-white">
              {formatMoney(product.priceCents)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EditorialSecondaryProduct({
  product,
  tag,
  scoped,
}: {
  product: EditorialProduct;
  tag?: string | null;
  scoped: boolean;
}) {
  return (
    <Link
      href={product.href}
      className={cn(
        "group block overflow-hidden rounded-2xl border",
        scoped ? "border-artist-border bg-artist-surface" : "border-border bg-card",
      )}
    >
      <div className="relative aspect-[4/5] bg-artist-bg">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt=""
            fill
            sizes="(min-width: 768px) 320px, 45vw"
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <div className="space-y-1 p-3">
        {tag && (
          <p className={cn("text-[9px] font-semibold uppercase tracking-[0.14em]", scoped ? "text-artist-accent" : "text-primary")}>
            {tag}
          </p>
        )}
        <p className={cn("line-clamp-2 text-sm font-medium", scoped && "text-artist-fg")}>
          {product.name}
        </p>
        <p className={cn("tabular font-semibold", scoped ? "text-artist-accent" : "text-foreground")}>
          {formatMoney(product.priceCents)}
        </p>
      </div>
    </Link>
  );
}

function EditorialRowProduct({
  product,
  scoped,
}: {
  product: EditorialProduct;
  scoped: boolean;
}) {
  return (
    <Link
      href={product.href}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-colors",
        scoped
          ? "border-artist-border bg-artist-surface hover:bg-artist-accent/5"
          : "border-border bg-card hover:bg-accent/30",
      )}
    >
      <div
        className={cn(
          "relative size-14 shrink-0 overflow-hidden rounded-lg",
          scoped ? "bg-artist-bg" : "bg-muted",
        )}
      >
        {product.images?.[0] ? (
          <Image src={product.images[0]} alt="" fill sizes="56px" className="object-contain p-0.5" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", scoped && "text-artist-fg")}>
          {product.name}
        </p>
        {product.tagline && (
          <p className={cn("truncate text-xs", scoped ? "text-artist-muted" : "text-muted-foreground")}>
            {product.tagline}
          </p>
        )}
      </div>
      <p className={cn("tabular shrink-0 font-semibold", scoped ? "text-artist-accent" : "text-foreground")}>
        {formatMoney(product.priceCents)}
      </p>
    </Link>
  );
}

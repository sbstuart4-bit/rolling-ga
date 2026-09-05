import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { formatMoney } from "@/lib/format";
import {
  AVAILABILITY_CHANNEL_LABELS,
  MERCH_SECTION_LABELS,
  type AvailabilityChannel,
  type MerchSection,
} from "@/lib/merch-catalog";
import { PRODUCT_ACCESS_LABELS } from "@/lib/types";
import type { StudioProductSummary } from "@/server/studio/merch-queries";
import { cn } from "@/lib/utils";

const INVENTORY_LABEL = {
  in_stock: "In stock",
  low_stock: "Low stock",
  sold_out: "Sold out",
} as const;

export function MerchProductCard({ product }: { product: StudioProductSummary }) {
  const image = product.images?.[0];

  return (
    <Link
      href={`/studio/merch/${product.id}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-card/40 px-4 py-3 transition-colors hover:bg-card"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {image ? (
          <Image src={image} alt="" fill className="object-cover" sizes="56px" />
        ) : (
          <Package className="absolute inset-0 m-auto size-5 text-muted-foreground/50" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-medium">{product.name}</p>
        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span>{product.category}</span>
          <span aria-hidden>·</span>
          <span>{PRODUCT_ACCESS_LABELS[product.accessType]}</span>
          <span aria-hidden>·</span>
          <span>{AVAILABILITY_CHANNEL_LABELS[product.availabilityChannel]}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="tabular text-sm font-medium">{formatMoney(product.basePriceCents)}</p>
        <InventoryBadge status={product.inventoryStatus} />
      </div>
    </Link>
  );
}

export function MerchSectionPanel({
  section,
  products,
}: {
  section: MerchSection;
  products: StudioProductSummary[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">
          {MERCH_SECTION_LABELS[section]}
        </h2>
        <p className="text-xs text-muted-foreground">{products.length} product{products.length === 1 ? "" : "s"}</p>
      </div>
      <ul className="space-y-2">
        {products.map((product) => (
          <li key={product.id}>
            <MerchProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EndlessAisleViz({
  physicalCore,
  rollingGaExtended,
  totalAvailable,
  eventLabel,
}: {
  physicalCore: number;
  rollingGaExtended: number;
  totalAvailable: number;
  eventLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card/80 to-muted/20 p-6">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Physical vs Endless Aisle
      </p>
      {eventLabel && <p className="mt-1 text-sm text-muted-foreground">{eventLabel}</p>}

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <StatBlock label="Carried at venue" value={physicalCore} accent="physical" />
        <span className="pb-3 text-2xl font-light text-muted-foreground">+</span>
        <StatBlock label="Rolling GA assortment" value={rollingGaExtended} accent="digital" />
        <span className="pb-3 text-2xl font-light text-muted-foreground">=</span>
        <StatBlock label="Available tonight" value={totalAvailable} accent="total" />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Carry the greatest hits at the booth. Let Rolling GA carry the endless aisle — digital
        products and extended assortment fans can access without every SKU traveling to every city.
      </p>
    </div>
  );
}

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "physical" | "digital" | "total";
}) {
  return (
    <div
      className={cn(
        "min-w-[7rem] rounded-xl border px-4 py-3",
        accent === "physical" && "border-amber-500/30 bg-amber-500/5",
        accent === "digital" && "border-violet-500/30 bg-violet-500/5",
        accent === "total" && "border-emerald-500/30 bg-emerald-500/5",
      )}
    >
      <p className="text-3xl font-semibold tabular">{value}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function InventoryBadge({ status }: { status: keyof typeof INVENTORY_LABEL }) {
  return (
    <span
      className={cn(
        "text-[10px] font-medium uppercase tracking-wide",
        status === "sold_out" && "text-destructive",
        status === "low_stock" && "text-amber-400",
        status === "in_stock" && "text-muted-foreground",
      )}
    >
      {INVENTORY_LABEL[status]}
    </span>
  );
}

export function AvailabilityBadge({ channel }: { channel: AvailabilityChannel }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        channel === "carried_at_venue" && "bg-amber-500/10 text-amber-300",
        channel === "rolling_ga" && "bg-violet-500/10 text-violet-300",
        channel === "both" && "bg-emerald-500/10 text-emerald-300",
      )}
    >
      {AVAILABILITY_CHANNEL_LABELS[channel]}
    </span>
  );
}

import Link from "next/link";
import { EndlessAisleViz, MerchProductCard } from "@/components/studio/merch-product-card";
import type { StudioProductSummary } from "@/server/studio/merch-queries";
import type { EventRow } from "@/server/events/queries";
import type { ShowAssortmentCounts } from "@/lib/merch-catalog";

export function ShowAssortmentView({
  event,
  counts,
  physicalCore,
  rollingGaExtended,
  cityExclusives,
  tourId,
}: {
  event: EventRow;
  counts: ShowAssortmentCounts;
  physicalCore: StudioProductSummary[];
  rollingGaExtended: StudioProductSummary[];
  cityExclusives: StudioProductSummary[];
  tourId: string;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold uppercase tracking-wide">
          {event.venueCity} assortment
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Physical core · Rolling GA extended · city exclusives
        </p>
      </div>

      <EndlessAisleViz
        physicalCore={counts.physicalCore}
        rollingGaExtended={counts.rollingGaExtended}
        totalAvailable={counts.totalAvailable}
        eventLabel={`${event.venueName} · ${event.venueCity}`}
      />

      <AssortmentSection
        title="Physical core"
        description="Products physically carried at this venue."
        products={physicalCore}
        actionHref={`/studio/merch/new?tourId=${tourId}`}
        actionLabel="Add tour product"
      />

      <AssortmentSection
        title="Rolling GA extended assortment"
        description="Digital and online-only products available through the event shop."
        products={rollingGaExtended}
        actionHref="/studio/merch/new?digital=1"
        actionLabel="Add endless aisle product"
      />

      <AssortmentSection
        title="City exclusives"
        description="Verified attendees only — not available at other shows."
        products={cityExclusives}
        actionHref={`/studio/merch/exclusive/new?eventId=${event.id}`}
        actionLabel="Create city exclusive"
      />
    </div>
  );
}

function AssortmentSection({
  title,
  description,
  products,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  products: StudioProductSummary[];
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Link href={actionHref} className="text-sm text-primary hover:underline">
          {actionLabel}
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No products configured yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {products.map((product) => (
            <li key={product.id}>
              <MerchProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

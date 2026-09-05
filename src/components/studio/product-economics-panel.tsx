import { formatMoney } from "@/lib/format";
import type { ProductEconomics } from "@/lib/merch-catalog";
import { SHIPPING_STRATEGY_LABELS } from "@/lib/types";

export function ProductEconomicsPanel({ economics }: { economics: ProductEconomics }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4">
      <div>
        <h3 className="font-semibold">Product economics</h3>
        <p className="text-xs text-muted-foreground">
          Carrier cost, fan charge, and artist subsidy are kept separate.
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <Row label="Retail price" value={formatMoney(economics.retailPriceCents)} />
        <Row
          label="Product cost"
          value={
            economics.unitCostCents != null
              ? formatMoney(economics.unitCostCents)
              : "Not supplied"
          }
          muted={economics.unitCostCents == null}
        />
        <Row
          label="Est. fulfillment (carrier)"
          value={
            economics.estimatedFulfillmentCostCents != null
              ? formatMoney(economics.estimatedFulfillmentCostCents)
              : "Not configured"
          }
          muted={economics.estimatedFulfillmentCostCents == null}
        />
        <Row
          label="Shipping strategy"
          value={
            economics.shippingStrategy
              ? SHIPPING_STRATEGY_LABELS[economics.shippingStrategy]
              : "Not configured"
          }
          muted={!economics.shippingStrategy}
        />
        <Row
          label="Est. artist shipping subsidy"
          value={
            economics.estimatedArtistSubsidyCents != null
              ? formatMoney(economics.estimatedArtistSubsidyCents)
              : "—"
          }
        />
        <Row
          label="Est. artist contribution"
          value={
            economics.estimatedContributionCents != null
              ? formatMoney(economics.estimatedContributionCents)
              : "Requires product cost"
          }
          highlight={economics.estimatedContributionCents != null}
          muted={economics.estimatedContributionCents == null}
        />
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  muted = false,
  highlight = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd
        className={
          highlight
            ? "mt-1 text-lg font-semibold tabular text-emerald-300"
            : muted
              ? "mt-1 text-sm italic text-muted-foreground"
              : "mt-1 text-sm font-medium tabular"
        }
      >
        {value}
      </dd>
    </div>
  );
}

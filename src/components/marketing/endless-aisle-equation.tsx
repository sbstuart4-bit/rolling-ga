import Image from "next/image";
import { ClaimLabel } from "@/components/marketing/claim-label";
import { ENDLESS_AISLE_EQUATION, MARKETING_PRODUCTS } from "@/components/marketing/marketing-fixtures";
import { SplitCompare } from "@/components/marketing/visual/split-compare";

const BOOTH_PRODUCTS = MARKETING_PRODUCTS.filter((p) => p.tag === "Booth" || p.tag === "City" || p.tag === "Show").slice(0, 8);
const DIGITAL_PRODUCTS = MARKETING_PRODUCTS;

export function EndlessAisleEquation() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <ClaimLabel kind="illustrative" />
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Numbers are illustrative</p>
      </div>

      <SplitCompare
        leftLabel="At the booth tonight"
        rightLabel="Rolling GA Endless Aisle"
        left={<ProductFan products={BOOTH_PRODUCTS} compact />}
        right={<ProductFan products={DIGITAL_PRODUCTS} scrollable accent />}
      />

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
        <EquationCard value={ENDLESS_AISLE_EQUATION.booth} label="Products at the booth" />
        <span className="hidden text-center font-display text-4xl text-muted-foreground sm:block" aria-hidden>
          +
        </span>
        <EquationCard value={ENDLESS_AISLE_EQUATION.rollingGa} label="Rolling GA products" accent />
        <span className="hidden text-center font-display text-4xl text-muted-foreground sm:block" aria-hidden>
          =
        </span>
        <EquationCard value={ENDLESS_AISLE_EQUATION.total} label="Products available tonight" total />
      </div>
      <p className="font-display text-2xl leading-tight sm:text-3xl">
        Carry the greatest hits.
        <br />
        <span className="text-primary">Rolling GA carries the Endless Aisle.</span>
      </p>
    </div>
  );
}

function ProductFan({
  products,
  compact = false,
  scrollable = false,
  accent = false,
}: {
  products: readonly { name: string; image: string; tag: string }[];
  compact?: boolean;
  scrollable?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={
        scrollable
          ? "flex max-h-48 gap-2 overflow-x-auto pb-1"
          : compact
            ? "grid grid-cols-4 gap-2"
            : "grid grid-cols-3 gap-2"
      }
    >
      {products.map((product) => (
        <div
          key={product.name}
          className={
            scrollable
              ? "relative size-16 shrink-0 overflow-hidden rounded-lg border border-white/10"
              : "relative aspect-square overflow-hidden rounded-lg border border-white/10"
          }
        >
          <Image src={product.image} alt={product.name} fill sizes="64px" className="object-cover" />
          {accent && product.tag === "Endless Aisle" ? (
            <span className="absolute inset-x-0 bottom-0 bg-primary/80 py-0.5 text-center text-[7px] font-bold uppercase text-primary-foreground">
              EA
            </span>
          ) : null}
        </div>
      ))}
      {scrollable ? (
        <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          +18 more
        </div>
      ) : null}
    </div>
  );
}

function EquationCard({
  value,
  label,
  accent = false,
  total = false,
}: {
  value: number;
  label: string;
  accent?: boolean;
  total?: boolean;
}) {
  return (
    <div
      className={
        total
          ? "deck-card rounded-2xl border-primary/40 bg-primary/10 p-6"
          : accent
            ? "deck-card rounded-2xl border-white/10 bg-[#161618] p-6"
            : "deck-card rounded-2xl border-white/8 bg-[#101012] p-6"
      }
    >
      <p className="font-display text-6xl leading-none tabular">{value}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  );
}

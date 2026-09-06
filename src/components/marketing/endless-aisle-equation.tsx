import Image from "next/image";
import { ClaimLabel } from "@/components/marketing/claim-label";
import {
  ENDLESS_AISLE_EQUATION,
  MARKETING_PRODUCTS,
} from "@/components/marketing/marketing-fixtures";

/** The whole assortment, since the point of the section is that it is wider than a booth. */
const ASSORTMENT = MARKETING_PRODUCTS;

/**
 * What the truck carries against what the catalogue can carry.
 *
 * The arithmetic is set as type on a rule rather than as three bordered stat
 * cards, and the assortment is shown as the actual product photography instead
 * of a side-by-side comparison panel.
 */
export function EndlessAisleEquation() {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-4 border-t border-world-rule pt-8">
        <Figure value={ENDLESS_AISLE_EQUATION.booth} label="At the booth tonight" />
        <span aria-hidden className="mk-display text-3xl text-world-muted md:text-5xl">
          +
        </span>
        <Figure value={ENDLESS_AISLE_EQUATION.rollingGa} label="On Rolling GA" />
        <span aria-hidden className="mk-display text-3xl text-world-muted md:text-5xl">
          =
        </span>
        <Figure
          value={ENDLESS_AISLE_EQUATION.total}
          label="Available tonight"
          trailing={<ClaimLabel kind="illustrative" />}
        />
      </div>

      <p className="mk-display mt-12 max-w-3xl text-[clamp(1.5rem,3.5vw,2.5rem)] leading-tight">
        Carry the greatest hits.
        <span className="block text-world-muted">Rolling GA carries the rest.</span>
      </p>

      {/* The assortment itself, at the size the fan browses it. */}
      <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ASSORTMENT.map((product) => (
          <li key={product.name}>
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 200px, 45vw"
                className="object-cover"
              />
            </div>
            <p className="mk-kicker mt-3 text-world-muted">{product.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Figure({
  value,
  label,
  trailing,
}: {
  value: number;
  label: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div>
      <p className="mk-display mk-display-tight text-[clamp(2.5rem,6vw,5rem)] tabular-nums">
        {value}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <p className="mk-kicker text-world-muted">{label}</p>
        {trailing}
      </div>
    </div>
  );
}

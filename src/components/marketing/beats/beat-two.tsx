import { SafeArt } from "@/components/marketing/degens/safe-art";
import { MarketingWorld } from "@/components/marketing/marketing-world";
import { BeatMarker } from "./beat-marker";

/**
 * BEAT 2 — THE MERCH TABLE, WITHOUT THE BAG
 *
 * The commercial wedge, made physical. Product photography at streetwear scale,
 * one object at a time, on the black it was already shot against — so the
 * garments sit in the page rather than inside tiles. Then the turn that makes
 * this more than merch software.
 */
export function BeatTwo() {
  return (
    <MarketingWorld world="degens" id="the-merch" className="border-t border-world-rule">
      <div className="mx-auto max-w-[100rem] px-5 pt-20 sm:px-8 md:pt-28">
        <BeatMarker n="02" label="The wedge" />
      </div>

      {/* The hero object, bleeding off the right edge at desktop. */}
      <div className="mx-auto grid max-w-[100rem] items-center gap-8 px-5 pt-10 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:pt-4">
        <h2 className="mk-display mk-display-tight text-[clamp(2.25rem,6.75vw,6rem)]">
          The merch table,
          <br />
          without the bag.
        </h2>
        <div className="relative -mx-5 sm:-mx-8 lg:mx-0 lg:-mr-16 xl:-mr-28">
          <SafeArt
            art="detroitTee"
            sizes="(min-width: 1024px) 48vw, 100vw"
            priority
            className="w-full"
          />
        </div>
      </div>

      {/* Three lines, as type. No icons, no arrows, no numbered steps. */}
      <div className="mx-auto max-w-[100rem] px-5 pb-24 pt-16 sm:px-8 md:grid md:grid-cols-[1fr_auto] md:items-end md:gap-16 md:pb-32 md:pt-24">
        <p className="mk-display text-[clamp(2.75rem,10vw,9rem)] leading-[0.86]">
          See it.
          <br />
          Buy it.
          <br />
          It ships.
        </p>
        <div className="mk-body mt-10 max-w-xs space-y-6 text-base text-world-muted md:mt-0 md:pb-4">
          <p>
            The samples stay at the table.
            <br />
            <span className="text-world-fg">The purchase moves to the phone.</span>
          </p>
          <p className="mk-display text-2xl text-world-fg md:text-3xl">
            No bag through the encore.
          </p>
          <p className="text-[0.6875rem] leading-relaxed">
            The Degens are a fictional artist created by Rolling GA to demonstrate the product.
          </p>
        </div>
      </div>

      {/* The rest of the assortment, as objects. */}
      <div className="mx-auto grid max-w-[100rem] gap-y-16 px-5 pb-24 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:items-end md:gap-x-12 md:pb-32">
        <figure className="space-y-4">
          <SafeArt art="hoodieFront" sizes="(min-width: 768px) 34vw, 92vw" className="w-full" />
          <figcaption className="mk-kicker text-world-muted">Tour hoodie</figcaption>
        </figure>
        <div className="space-y-12">
          <figure className="space-y-4">
            <SafeArt art="skateboard" sizes="(min-width: 768px) 54vw, 92vw" className="w-full" />
            <figcaption className="mk-kicker text-world-muted">Detroit deck</figcaption>
          </figure>
          <SafeArt art="hoodieDetails" sizes="(min-width: 768px) 54vw, 92vw" className="w-full" />
        </div>
      </div>

      <div className="mx-auto max-w-[100rem] border-t border-world-rule px-5 py-20 sm:px-8 md:py-28">
        <p className="mk-display max-w-5xl text-[clamp(1.875rem,6vw,5rem)]">
          The purchase isn&rsquo;t the end of a transaction.
          <span className="block text-world-accent">It&rsquo;s the start of a relationship.</span>
        </p>
      </div>
    </MarketingWorld>
  );
}

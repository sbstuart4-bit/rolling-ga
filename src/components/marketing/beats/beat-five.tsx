import Link from "next/link";
import { SafeArt } from "@/components/marketing/degens/safe-art";
import { ShowCredential } from "@/components/marketing/degens/show-credential";
import { MarketingWorld } from "@/components/marketing/marketing-world";
import { BeatMarker } from "./beat-marker";

/**
 * BEAT 5 — THE ARTIST SIDE
 *
 * The reveal, deliberately late and deliberately small. The Degens world
 * withdraws and Rolling GA restraint returns — but the credential keeps its
 * colours, because it belongs to the fan now rather than to whoever owns the
 * page around it.
 *
 * No figures. Every number here would be invented, and for this audience the
 * two sentences about attribution and consent carry more weight than a chart
 * would.
 */

const WHAT_THE_ARTIST_SEES = [
  { label: "Connected fans", meaning: "Fans who gave this artist permission" },
  { label: "Purchasing fans", meaning: "Fans who bought at least once" },
  { label: "Repeat purchasers", meaning: "Fans who bought more than once" },
  { label: "Show-night value", meaning: "Orders placed during the show window" },
  { label: "Post-show value", meaning: "Orders attributed to the show afterwards" },
];

export function BeatFive() {
  return (
    <MarketingWorld world="rga" id="the-artist-side" className="border-t border-world-rule">
      <div className="mx-auto max-w-[100rem] px-5 py-20 sm:px-8 md:py-28">
        <BeatMarker n="05" label="After load-out" />

        <div className="mt-12 grid gap-16 lg:grid-cols-[1.25fr_0.75fr] lg:gap-20">
          <div>
            <h2 className="mk-display max-w-3xl text-[clamp(1.875rem,5.5vw,4.5rem)]">
              The artist can finally see
              <br />
              what happened after load-out.
            </h2>

            <dl className="mt-16">
              {WHAT_THE_ARTIST_SEES.map((item) => (
                <div
                  key={item.label}
                  className="grid gap-1 border-t border-world-rule py-5 sm:grid-cols-[1fr_1.1fr] sm:items-baseline sm:gap-8"
                >
                  <dt className="mk-display text-2xl md:text-3xl">{item.label}</dt>
                  <dd className="mk-body text-sm text-world-muted">{item.meaning}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-16 grid max-w-3xl gap-8 border-t border-world-rule pt-10 sm:grid-cols-2">
              <p className="mk-body text-sm leading-relaxed text-world-muted">
                Rolling GA only credits a purchase to a show when the link is provable. The number
                is smaller, and it&rsquo;s real.
              </p>
              <p className="mk-body text-sm leading-relaxed text-world-muted">
                An artist can only see a fan who gave that artist permission. Attending never
                grants it. Buying never grants it. The fan can withdraw it.
              </p>
            </div>

            <Link
              href="/for-artists"
              className="mk-kicker mt-12 inline-flex items-center gap-3 border-b border-world-rule pb-1 text-world-fg transition-colors hover:border-world-fg"
            >
              See the economics and how a show night actually runs
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>

          {/*
           * What the fan earned, still in the artist's colours after the artist's
           * world has receded. The nested world is the point, not decoration.
           */}
          <div
            data-world="degens"
            className="relative flex items-start justify-center gap-6 bg-transparent lg:justify-end"
          >
            <div className="pointer-events-none relative w-full max-w-sm">
              <ShowCredential className="w-full rotate-[2deg]" />
              <SafeArt
                art="detroitTee"
                sizes="200px"
                className="absolute -bottom-10 -left-6 w-32 rotate-[-6deg] md:w-40"
              />
            </div>
          </div>
        </div>
      </div>
    </MarketingWorld>
  );
}

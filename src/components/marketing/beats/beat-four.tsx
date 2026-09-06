import { SafeArt } from "@/components/marketing/degens/safe-art";
import type { DegensArtId } from "@/components/marketing/degens/degens-art";
import { MarketingWorld } from "@/components/marketing/marketing-world";
import { BeatMarker } from "./beat-marker";

/**
 * BEAT 4 — ONE FAN. MORE THAN ONE TRANSACTION.
 *
 * The relationship continuing, told through the seeded demo fan rather than
 * through feature cards. Relative time only: the moment an absolute date appears
 * it has to agree with the artwork, and the artwork disagrees with itself.
 *
 * The beat closes on the line that earns Beat 5. By the time the artist side is
 * revealed, the visitor should already want it.
 */

interface Moment {
  when: string;
  what: string;
  art?: DegensArtId;
}

const MOMENTS: readonly Moment[] = [
  {
    when: "Show night",
    what: "Buys the Detroit Encore Tee at the encore.",
    art: "detroitTee",
  },
  {
    when: "After the encore",
    what: "Chooses to stay connected. It\u2019s a question, not a consequence.",
  },
  {
    when: "Ninety days later",
    what: "A drop made only for the people who were in that room.",
    art: "numberedPoster",
  },
  {
    when: "Next tour",
    what: "Comes back. This time the artist already knows.",
    art: "returningPrint",
  },
  {
    when: "One year later",
    what: "The Detroit anniversary. The same night, one year on.",
    art: "anniversaryHoodieBack",
  },
];

export function BeatFour() {
  return (
    <MarketingWorld world="degens" id="one-fan" className="border-t border-world-rule">
      <div className="mx-auto max-w-[100rem] px-5 pt-20 sm:px-8 md:pt-28">
        <BeatMarker n="04" label="Thirteen months, one fan" />
        <h2 className="mk-display mk-display-tight mt-12 max-w-5xl text-[clamp(2.25rem,8vw,7.5rem)]">
          One fan.
          <br />
          More than one transaction.
        </h2>
      </div>

      <div className="mx-auto max-w-[88rem] px-5 pt-16 sm:px-8 md:pt-24">
        {MOMENTS.map((moment) => (
          <div
            key={moment.when}
            className="grid gap-x-10 gap-y-5 border-t border-world-rule py-10 md:grid-cols-[10rem_1fr_15rem] md:items-start md:py-14"
          >
            <p className="mk-kicker pt-1.5 text-world-muted">{moment.when}</p>
            <p className="mk-body max-w-xl text-xl leading-snug md:text-2xl">{moment.what}</p>
            {/*
              Stacked on mobile the artefact can take its natural shape. Once
              the moments become rows, every artefact hangs at the same height
              and aligns to the same right edge, so a portrait print and a
              landscape garment keep the row rhythm instead of stretching one
              row to twice the height of the others.
            */}
            {moment.art ? (
              <span className="block md:flex md:h-44 md:justify-end">
                <SafeArt
                  art={moment.art}
                  sizes="(min-width: 768px) 240px, 40vw"
                  className="w-40 md:h-full md:w-auto"
                />
              </span>
            ) : (
              <span aria-hidden />
            )}
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-[100rem] border-t border-world-rule px-5 py-20 sm:px-8 md:py-28">
        <p className="mk-display max-w-5xl text-[clamp(1.875rem,6vw,5rem)]">
          A concert measures transactions.
          <span className="block text-world-accent">
            Rolling GA can measure the relationship.
          </span>
        </p>
        <p className="mk-body mt-14 max-w-md text-base text-world-muted">
          The fan can see all of this. Until now, the artist couldn&rsquo;t.
        </p>
      </div>
    </MarketingWorld>
  );
}

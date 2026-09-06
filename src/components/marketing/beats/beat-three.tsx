import { SafeArt } from "@/components/marketing/degens/safe-art";
import { CredentialStub, ShowCredential } from "@/components/marketing/degens/show-credential";
import { MarketingWorld } from "@/components/marketing/marketing-world";
import { BeatMarker } from "./beat-marker";

/**
 * BEAT 3 — I WAS THERE
 *
 * The emotional centre, treated as a hero product idea rather than a feature.
 * The credential lands as an object, then the page shows what it opened, then
 * one credential becomes a history.
 *
 * No dated artwork appears alongside the credential: this frame says Detroit,
 * June 30, Ironworks out loud, and the generated Degens art disagrees.
 */

/** Seven kept shows. The three named cities are the ones the demo actually seeds. */
const HISTORY = [
  { city: "Detroit", detail: "First show" },
  { city: "Toronto", detail: "Second show" },
  { city: "Chicago", detail: "Third show" },
  { city: "Detroit", detail: "Anniversary", dimmed: true },
  { city: "Toronto", detail: "Night two", dimmed: true },
  { city: "Detroit", detail: "Returning", dimmed: true },
  { city: "Chicago", detail: "Next tour", dimmed: true },
];

export function BeatThree() {
  return (
    <MarketingWorld world="degens" id="i-was-there" className="border-t border-world-rule">
      <div className="mx-auto max-w-[100rem] px-5 pt-20 sm:px-8 md:pt-28">
        <BeatMarker n="03" label="Earned in the room" />
      </div>

      {/* The object, alone, at a scale software does not usually risk. */}
      <div className="mx-auto grid max-w-[100rem] gap-12 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
        <ShowCredential className="w-full max-w-md rotate-[-1.5deg] lg:max-w-lg" />
        <div className="space-y-10">
          <p className="mk-display text-[clamp(1.75rem,4.5vw,3.5rem)]">
            It can&rsquo;t be bought, gifted or claimed afterward.
            <span className="block text-world-muted">It was earned in the room.</span>
          </p>
          <div className="space-y-6 border-t border-world-rule pt-8">
            <p className="mk-body max-w-md text-lg text-world-muted">
              And some things only open for the people who were there.
            </p>
            <div className="flex flex-wrap items-end gap-8">
              <SafeArt
                art="editionStamp"
                sizes="(min-width: 768px) 208px, 144px"
                className="w-36 border border-world-rule md:w-52"
              />
              <SafeArt
                art="detroitTee"
                sizes="(min-width: 768px) 256px, 160px"
                className="w-40 md:w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* One credential becomes a history. */}
      <div className="mx-auto max-w-[100rem] border-t border-world-rule px-5 py-20 sm:px-8 md:py-28">
        <p className="mk-display mk-display-tight text-[clamp(2.5rem,10vw,9.5rem)]">
          One show.
          <br />
          Three shows.
          <br />
          <span className="text-world-accent">Seven shows.</span>
        </p>

        <div className="no-scrollbar -mx-5 mt-14 flex gap-3 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {HISTORY.map((show, i) => (
            <CredentialStub
              key={`${show.city}-${i}`}
              city={show.city}
              detail={show.detail}
              dimmed={show.dimmed}
              className="w-36 md:w-40"
            />
          ))}
        </div>

        <p className="mk-display mt-20 max-w-4xl text-[clamp(1.875rem,6vw,5rem)]">
          This isn&rsquo;t a follow.
          <br />
          It&rsquo;s my history with this artist.
        </p>
      </div>
    </MarketingWorld>
  );
}

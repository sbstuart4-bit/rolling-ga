import type { Metadata } from "next";
import { SafeArt } from "@/components/marketing/degens/safe-art";
import { CredentialStub, ShowCredential } from "@/components/marketing/degens/show-credential";
import { BeatMarker } from "@/components/marketing/beats/beat-marker";
import { ExperienceDegensForm } from "@/components/marketing/experience-degens-form";
import { MarketingWorld } from "@/components/marketing/marketing-world";

export const metadata: Metadata = {
  title: "I was there",
  description:
    "Attendance you can prove, a show you keep, and the things that only open for the people who were in the room.",
};

/** The fan-facing page. Same world, same objects, told from the fan's side. */
const HISTORY = [
  { city: "Detroit", detail: "First show" },
  { city: "Toronto", detail: "Second show" },
  { city: "Chicago", detail: "Third show" },
  { city: "Detroit", detail: "Anniversary" },
];

const WHAT_OPENS = [
  { label: "City exclusives", meaning: "Made for the room you were standing in" },
  { label: "Attendee-only drops", meaning: "Offered to the people who were at that show" },
  { label: "Encore drops", meaning: "Released while the night is still happening" },
  { label: "Anniversary drops", meaning: "The same night, a year on" },
  { label: "Returning-fan access", meaning: "The next tour opens for you first" },
];

export default function IWasTherePage() {
  return (
    <>
      <MarketingWorld world="degens">
        <div className="mx-auto grid max-w-[100rem] gap-14 px-5 pb-20 pt-16 sm:px-8 md:pb-28 md:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20">
          <div>
            <p className="mk-kicker text-world-accent">Earned in the room</p>
            <h1 className="mk-display mk-display-tight mt-8 text-[clamp(3rem,12vw,11rem)]">
              I was there.
            </h1>
            <p className="mk-body mt-10 max-w-lg text-lg leading-relaxed text-world-muted md:text-xl">
              You showed up. Rolling GA makes that provable, permanent and yours &mdash; a show you
              keep rather than a receipt you lose.
            </p>
          </div>
          <ShowCredential className="w-full max-w-md rotate-[-1.5deg] lg:ml-auto lg:max-w-lg" />
        </div>
      </MarketingWorld>

      <MarketingWorld world="rga" className="border-t border-world-rule">
        <div className="mx-auto max-w-[100rem] px-5 py-20 sm:px-8 md:py-28">
          <BeatMarker n="01" label="What it is" />
          <p className="mk-display mt-12 max-w-4xl text-[clamp(1.75rem,5vw,4rem)]">
            It can&rsquo;t be bought, gifted or claimed afterward.
            <span className="block text-world-muted">It was earned in the room.</span>
          </p>
          <div className="mt-14 grid max-w-4xl gap-8 border-t border-world-rule pt-10 sm:grid-cols-2">
            <p className="mk-body text-sm leading-relaxed text-world-muted">
              Attendance is confirmed at the venue &mdash; a show QR, a location check, or a member
              of the venue team. It is recorded once and it does not expire.
            </p>
            <p className="mk-body text-sm leading-relaxed text-world-muted">
              Staying connected with an artist is a separate question, asked plainly. Attending
              never grants it. Buying never grants it. You can withdraw it at any time.
            </p>
          </div>
        </div>
      </MarketingWorld>

      <MarketingWorld world="degens" className="border-t border-world-rule">
        <div className="mx-auto max-w-[100rem] px-5 py-20 sm:px-8 md:py-28">
          <BeatMarker n="02" label="My shows" />
          <p className="mk-display mk-display-tight mt-12 max-w-4xl text-[clamp(2rem,7vw,6rem)]">
            This isn&rsquo;t a follow.
            <br />
            It&rsquo;s my history with this artist.
          </p>
          <div className="no-scrollbar -mx-5 mt-12 flex gap-3 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {HISTORY.map((show, i) => (
              <CredentialStub
                key={`${show.city}-${i}`}
                city={show.city}
                detail={show.detail}
                className="w-36 md:w-40"
              />
            ))}
          </div>
        </div>
      </MarketingWorld>

      <MarketingWorld world="degens" className="border-t border-world-rule">
        <div className="mx-auto grid max-w-[100rem] gap-14 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <BeatMarker n="03" label="What it opens" />
            <dl className="mt-12">
              {WHAT_OPENS.map((item) => (
                <div
                  key={item.label}
                  className="grid gap-1 border-t border-world-rule py-5 sm:grid-cols-[1fr_1.1fr] sm:items-baseline sm:gap-8"
                >
                  <dt className="mk-display text-2xl md:text-3xl">{item.label}</dt>
                  <dd className="mk-body text-sm text-world-muted">{item.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex items-end gap-6 lg:justify-end">
            <SafeArt art="editionStamp" sizes="160px" className="w-28 border border-world-rule" />
            <SafeArt art="numberedPoster" sizes="320px" className="w-44 md:w-60" />
          </div>
        </div>
      </MarketingWorld>

      <MarketingWorld world="rga" className="border-t border-world-rule">
        <div className="mx-auto max-w-[100rem] px-5 py-24 sm:px-8 md:py-32">
          <h2 className="mk-display mk-display-tight max-w-3xl text-[clamp(2.25rem,7vw,6rem)]">
            Go to the show.
          </h2>
          <ExperienceDegensForm
            className="mt-12"
            size="large"
            secondary={{ href: "/for-artists", label: "See the artist side" }}
          />
        </div>
      </MarketingWorld>
    </>
  );
}

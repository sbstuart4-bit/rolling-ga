import Image from "next/image";
import {
  HOME_HERO_BENEFITS,
  MKT_PHOTOS,
} from "@/components/marketing/home/marketing-home-fixtures";
import { ExperienceNovaButton } from "@/components/marketing/experience-nova-cta";
import {
  MktBenefitRow,
  MktDisplayHeading,
  MktEyebrow,
  MktOutlineButton,
} from "@/components/marketing/site";
import { experienceMarisolArtistStudioAction } from "@/server/marketing/demo-entry";

/**
 * Approved homepage hero — full-bleed stage photography with artist-focused copy.
 */
export function HomeHero() {
  return (
    <section className="relative isolate min-h-[calc(100dvh-4.75rem)] overflow-hidden lg:min-h-[calc(100dvh-5.75rem)]">
      <Image
        src={MKT_PHOTOS.heroHomeBackdrop}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[center_38%] brightness-[1.06] contrast-[1.04]"
      />

      {/* Strong scrim on the left for copy; keep the stage and crowd visible on the right. */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/35 to-black/10"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/55 via-transparent to-black/20"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4.75rem)] max-w-7xl flex-col justify-between px-5 py-10 sm:px-8 sm:py-12 lg:min-h-[calc(100dvh-5.75rem)] lg:px-10 lg:py-14">
        <div className="max-w-2xl pt-4 md:pt-8 lg:max-w-3xl lg:pt-10">
          <MktEyebrow>For artists</MktEyebrow>

          <MktDisplayHeading
            as="h1"
            className="mt-5 text-[clamp(2.25rem,9vw,5rem)] leading-[0.9] sm:text-[clamp(2.75rem,7.5vw,5rem)]"
          >
            More merch.
            <span className="block">Bigger moments.</span>
            <span className="block text-mkt-purple">Longer relationships.</span>
          </MktDisplayHeading>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Turn every show into more revenue and a lasting connection with your fans.
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-5">
            <form action={experienceMarisolArtistStudioAction} className="w-full sm:w-auto">
              <ExperienceNovaButton
                size="large"
                label="Experience the Demo"
                className="w-full sm:w-auto"
              />
            </form>
            <MktOutlineButton href="/pilot#conversation" className="w-full justify-center sm:w-auto">
              Talk to Our Team
            </MktOutlineButton>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-10 md:pt-12 lg:mt-16">
          <MktBenefitRow items={HOME_HERO_BENEFITS} size="large" />
        </div>
      </div>
    </section>
  );
}

import { HOME_ARTIST_VALUE_BENEFITS } from "@/components/marketing/home/marketing-home-fixtures";
import {
  MktDisplayHeading,
  MktEyebrow,
  MktPhotoPlaceholder,
  MktSectionShell,
} from "@/components/marketing/site";

/**
 * Approved homepage artist-value band — docs/website-reference/homepage-approved.png
 *
 * Benefits framed as pilot hypotheses, not proven commercial outcomes.
 */
export function HomeArtistValue() {
  return (
    <MktSectionShell tone="light" className="py-16 md:py-20 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <MktPhotoPlaceholder
          label="Approved photography: guitarist performing on stage — artist value section"
          aspect="portrait"
          className="w-full max-w-md rounded-2xl lg:max-w-none"
        />

        <div>
          <MktEyebrow className="text-mkt-purple">For artists</MktEyebrow>
          <MktDisplayHeading
            as="h2"
            className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)] text-[#0a0a0a]"
          >
            More than merch.
            <span className="block text-mkt-purple">A stronger business.</span>
          </MktDisplayHeading>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#52525b] sm:text-lg">
            Rolling GA is built to test what happens when show-night commerce, attendance
            verification, and fan relationships work as one system — without adding merch-table
            complexity.
          </p>

          <ul className="mt-10 grid gap-8 sm:grid-cols-2">
            {HOME_ARTIST_VALUE_BENEFITS.map(({ icon: Icon, label, body }) => (
              <li key={label}>
                <span className="mb-3 flex size-11 items-center justify-center rounded-full border border-black/15 text-[#0a0a0a]">
                  <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                </span>
                <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[#0a0a0a]">
                  {label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#52525b]">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </MktSectionShell>
  );
}

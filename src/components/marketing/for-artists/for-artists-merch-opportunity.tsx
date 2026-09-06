import {
  FOR_ARTISTS_MERCH_OPPORTUNITIES,
  FOR_ARTISTS_SHOP_SCREENSHOT,
} from "@/components/marketing/for-artists/marketing-for-artists-fixtures";
import {
  MktDisplayHeading,
  MktEyebrow,
  MktPhoneFrame,
  MktSectionShell,
} from "@/components/marketing/site";

export function ForArtistsMerchOpportunity() {
  return (
    <MktSectionShell tone="light" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
        <div className="min-w-0">
          <MktEyebrow className="text-mkt-purple">Beyond the table</MktEyebrow>
          <MktDisplayHeading
            as="h2"
            className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)] text-[#0a0a0a]"
          >
            Sell what the table
            <span className="block text-mkt-purple">can&rsquo;t hold.</span>
          </MktDisplayHeading>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#52525b] sm:text-lg">
            Pilot capabilities to explore — not proven commercial outcomes. Rolling GA is built to
            test what becomes possible when show-night commerce isn&rsquo;t limited to what fits on
            the merch table.
          </p>

          <ul className="mt-10 space-y-8">
            {FOR_ARTISTS_MERCH_OPPORTUNITIES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full border border-black/15 text-[#0a0a0a]">
                  <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[#0a0a0a]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#52525b] sm:text-base">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-[320px] lg:mx-0 lg:ml-auto lg:max-w-[340px]">
          <MktPhoneFrame
            align="start"
            loading="eager"
            screenshot={FOR_ARTISTS_SHOP_SCREENSHOT}
            screenshotAlt="Nova Kestrel attendee shop in Rolling GA — buy from your phone at the show"
            className="mkt-how-it-works-phone mx-auto lg:mx-0"
          />
        </div>
      </div>
    </MktSectionShell>
  );
}

import {
  FOR_ARTISTS_RELATIONSHIP_CAPABILITIES,
  FOR_ARTISTS_RELATIONSHIP_SCREENS,
} from "@/components/marketing/for-artists/marketing-for-artists-fixtures";
import {
  MktDisplayHeading,
  MktEyebrow,
  MktPhoneFrame,
  MktSectionShell,
} from "@/components/marketing/site";

export function ForArtistsRelationship() {
  return (
    <MktSectionShell tone="dark" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow>It&rsquo;s bigger than merch</MktEyebrow>
        <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)]">
          The show can start
          <span className="block text-mkt-purple">a relationship.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-mkt-muted sm:text-lg">
          Being at the show can become a permissioned connection — with observed commerce enriching
          what artists know within Rolling GA, not a claim about a fan&rsquo;s entire spending
          history.
        </p>
      </div>

      <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:mt-16 lg:gap-10">
        {FOR_ARTISTS_RELATIONSHIP_CAPABILITIES.map(({ icon: Icon, title, body }) => (
          <li key={title}>
            <span className="mb-3 flex size-11 items-center justify-center rounded-full border border-white/20 text-mkt-fg">
              <Icon className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-mkt-fg sm:text-base">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-mkt-muted sm:text-base">{body}</p>
          </li>
        ))}
      </ul>

      <ol className="mt-16 grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-x-10 md:gap-y-0 lg:mt-20">
        {FOR_ARTISTS_RELATIONSHIP_SCREENS.map((screen, index) => (
          <li key={screen.label} className="flex min-w-0 flex-col">
            <p className="mkt-eyebrow">{screen.label}</p>
            <MktPhoneFrame
              align="start"
              loading="eager"
              screenshot={screen.screenshot}
              screenshotAlt={screen.alt}
              className="mkt-how-it-works-phone mt-6 md:mt-8"
            />
            {index < FOR_ARTISTS_RELATIONSHIP_SCREENS.length - 1 ? (
              <span className="mt-8 block text-center text-white/20 md:hidden" aria-hidden>
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </MktSectionShell>
  );
}

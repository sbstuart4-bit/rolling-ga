import { HOW_IT_WORKS_ARTIST_CAPABILITIES } from "@/components/marketing/how-it-works/marketing-how-it-works-fixtures";
import {
  MktDisplayHeading,
  MktOutlineButton,
  MktSectionShell,
} from "@/components/marketing/site";

export function HowItWorksArtists() {
  return (
    <MktSectionShell tone="dark" className="py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktDisplayHeading as="h2" className="text-[clamp(1.875rem,5vw,3.25rem)]">
          One night can create
          <span className="block text-mkt-purple">a longer relationship.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-mkt-muted sm:text-lg">
          Rolling GA is built to test what happens when show-night commerce, attendance, and fan
          relationships work as one system — framed as product capabilities to explore in pilot, not
          proven commercial outcomes.
        </p>
      </div>

      <ul className="mt-12 grid gap-8 md:mt-16 md:grid-cols-2 lg:gap-10">
        {HOW_IT_WORKS_ARTIST_CAPABILITIES.map(({ icon: Icon, title, body }) => (
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

      <MktOutlineButton href="/for-artists" className="mt-12">
        Explore Rolling GA for Artists <span aria-hidden>&rarr;</span>
      </MktOutlineButton>
    </MktSectionShell>
  );
}

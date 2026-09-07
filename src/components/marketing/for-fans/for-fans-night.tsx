import {
  FOR_FANS_NIGHT_BENEFITS,
  FOR_FANS_NIGHT_SHOP,
  FOR_FANS_NIGHT_UNLOCK,
} from "@/components/marketing/for-fans/marketing-for-fans-fixtures";
import {
  MktDisplayHeading,
  MktEyebrow,
  MktPhoneFrame,
  MktSectionShell,
} from "@/components/marketing/site";

export function ForFansNight() {
  return (
    <MktSectionShell tone="dark" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow>At the show</MktEyebrow>
        <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)]">
          Merch shouldn&rsquo;t take you
          <span className="block text-mkt-purple">out of the moment.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-mkt-muted sm:text-lg">
          See what&rsquo;s available, unlock show-specific merch when you&rsquo;re there, and shop
          from your phone without spending the night in a merch line.
        </p>
      </div>

      <ul className="mt-10 grid gap-8 sm:grid-cols-3 md:mt-14">
        {FOR_FANS_NIGHT_BENEFITS.map(({ icon: Icon, title, body }) => (
          <li key={title}>
            <span className="mb-3 flex size-11 items-center justify-center rounded-full border border-white/20 text-mkt-fg">
              <Icon className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-mkt-fg">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-mkt-muted sm:text-base">{body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-12 grid grid-cols-1 gap-12 md:mt-16 md:grid-cols-2 md:gap-x-10 md:gap-y-0">
        <div className="flex min-w-0 flex-col">
          <p className="mkt-eyebrow">Unlock</p>
          <MktPhoneFrame
            align="start"
            loading="eager"
            screenshot={FOR_FANS_NIGHT_UNLOCK}
            screenshotAlt="Marisol Reyes event page in Rolling GA — venue arrival unlocks show-night exclusives"
            className="mkt-how-it-works-phone mt-6 md:mt-8"
          />
          <span className="mt-8 block text-center text-white/20 md:hidden" aria-hidden>
            ↓
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <p className="mkt-eyebrow">Shop</p>
          <MktPhoneFrame
            align="start"
            loading="eager"
            screenshot={FOR_FANS_NIGHT_SHOP}
            screenshotAlt="Marisol Reyes attendee shop in Rolling GA — A Tender Night tour merchandise"
            className="mkt-how-it-works-phone mt-6 md:mt-8"
          />
        </div>
      </div>
    </MktSectionShell>
  );
}

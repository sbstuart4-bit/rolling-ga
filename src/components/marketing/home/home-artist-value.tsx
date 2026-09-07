import { HOME_ARTIST_VALUE_BENEFITS } from "@/components/marketing/home/marketing-home-fixtures";
import {
  MktDisplayHeading,
  MktEyebrow,
  MktSectionShell,
} from "@/components/marketing/site";

/**
 * Artist value — four outcomes for artists running Rolling GA.
 */
export function HomeArtistValue() {
  return (
    <MktSectionShell tone="dark" className="py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow>For artists</MktEyebrow>
        <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)]">
          More merch.
          <span className="block text-mkt-purple">Bigger moments. Longer relationships.</span>
        </MktDisplayHeading>
      </div>

      <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {HOME_ARTIST_VALUE_BENEFITS.map(({ icon: Icon, label, body }) => (
          <li key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <span className="mb-4 flex size-11 items-center justify-center rounded-full border border-white/20 text-mkt-fg">
              <Icon className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-mkt-fg">
              {label}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-mkt-muted">{body}</p>
          </li>
        ))}
      </ul>
    </MktSectionShell>
  );
}

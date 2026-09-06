import { FOR_FANS_NEXT_SHOW_POSSIBILITIES } from "@/components/marketing/for-fans/marketing-for-fans-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function ForFansNextShow() {
  return (
    <MktSectionShell tone="dark" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow>The next show</MktEyebrow>
        <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)]">
          You don&rsquo;t have to
          <span className="block text-mkt-purple">start over.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-mkt-muted sm:text-lg">
          When a fan chooses to stay connected, the next artist experience can begin with context
          — the shows they&rsquo;ve attended and the relationship they&rsquo;ve already built.
        </p>
      </div>

      <ul className="mt-12 grid gap-8 sm:grid-cols-3 md:mt-16">
        {FOR_FANS_NEXT_SHOW_POSSIBILITIES.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-7"
          >
            <span className="mb-4 flex size-11 items-center justify-center rounded-full border border-mkt-purple/35 bg-mkt-purple/10 text-mkt-fg">
              <Icon className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-mkt-fg">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-mkt-muted sm:text-base">{body}</p>
          </li>
        ))}
      </ul>
    </MktSectionShell>
  );
}

import { FOR_FANS_CONTROL_PRINCIPLES } from "@/components/marketing/for-fans/marketing-for-fans-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function ForFansFanControl() {
  return (
    <MktSectionShell tone="light" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow className="text-mkt-purple">Your relationship</MktEyebrow>
        <MktDisplayHeading
          as="h2"
          className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)] text-[#0a0a0a]"
        >
          Connected
          <span className="block text-mkt-purple">by choice.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#52525b] sm:text-lg">
          Rolling GA is designed around permissioned fan relationships. Being at a show can establish
          the moment. Staying connected should remain the fan&rsquo;s choice.
        </p>
      </div>

      <ul className="mt-12 grid gap-6 md:mt-16 lg:grid-cols-3 lg:gap-8">
        {FOR_FANS_CONTROL_PRINCIPLES.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="rounded-2xl border border-black/10 bg-white p-6 sm:p-7"
          >
            <span className="mb-4 flex size-11 items-center justify-center rounded-full border border-black/15 text-[#0a0a0a]">
              <Icon className="size-5" strokeWidth={1.5} aria-hidden />
            </span>
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[#0a0a0a]">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#52525b] sm:text-base">{body}</p>
          </li>
        ))}
      </ul>
    </MktSectionShell>
  );
}

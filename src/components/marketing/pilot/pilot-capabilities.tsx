import {
  Package,
  Shield,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

const PILOT_CAPABILITY_ITEMS = [
  { icon: Ticket, label: "Show-aware fan experience" },
  { icon: ShoppingBag, label: "Digital merch access" },
  { icon: Smartphone, label: "Show-night / show-specific unlocks" },
  { icon: Package, label: "Commerce orchestration" },
  { icon: Sparkles, label: "I Was There / attendance history" },
  { icon: Users, label: "Permissioned artist–fan relationship" },
  { icon: Shield, label: "Observed fan & commerce signals within Rolling GA" },
] as const;

export function PilotCapabilities() {
  return (
    <MktSectionShell tone="dark" className="overflow-x-clip pb-16 pt-16 max-md:pb-20 md:py-20 lg:py-24">
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <div className="max-w-xl">
          <MktEyebrow>Our role</MktEyebrow>
          <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)]">
            We bring the
            <span className="block text-mkt-purple">connection layer.</span>
          </MktDisplayHeading>
          <p className="mt-5 text-base leading-relaxed text-mkt-muted sm:text-lg">
            Rolling GA connects the fan-facing journey around the show. A pilot is designed to
            work with the existing live-music ecosystem — not pretend Rolling GA replaces it.
          </p>
        </div>

        <ul className="grid gap-2.5 max-md:gap-2 sm:grid-cols-2 sm:gap-4">
          {PILOT_CAPABILITY_ITEMS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 max-md:py-2.5 sm:gap-3 sm:p-5"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-mkt-purple/35 bg-mkt-purple/10 text-mkt-fg sm:size-10">
                <Icon className="size-3.5 sm:size-4" strokeWidth={1.5} aria-hidden />
              </span>
              <p className="pt-0.5 text-xs font-semibold uppercase leading-snug tracking-[0.08em] text-mkt-fg sm:pt-2 sm:text-sm">
                {label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </MktSectionShell>
  );
}

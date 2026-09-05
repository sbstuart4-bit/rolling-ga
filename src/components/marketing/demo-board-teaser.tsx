import Link from "next/link";
import { Disc3, Mic2, ShieldCheck, Truck } from "lucide-react";
import { ClaimLabel } from "@/components/marketing/claim-label";
import { MarketingGlow } from "@/components/marketing/visual/marketing-glow";
import { ScrollReveal } from "@/components/marketing/visual/scroll-reveal";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

const PERSONAS: { label: string; role: string; icon: LucideIcon; accent: string }[] = [
  { label: "Fan", role: "Live · Drops · My Shows", icon: Disc3, accent: "border-primary/40 bg-primary/10 text-primary" },
  { label: "Artist", role: "Studio · Live · Merch", icon: Mic2, accent: "border-[#D8FF3E]/30 bg-[#D8FF3E]/10 text-[#D8FF3E]" },
  { label: "Ops", role: "Fulfillment · Orders", icon: Truck, accent: "border-white/20 bg-white/5 text-foreground" },
  { label: "Admin", role: "Platform oversight", icon: ShieldCheck, accent: "border-white/20 bg-white/5 text-muted-foreground" },
];

export function DemoBoardTeaser() {
  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-[#0a0a0c] py-20 sm:py-24">
      <MarketingGlow variant="primary" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
        <ScrollReveal>
          <p className="eyebrow text-primary">Live demo</p>
          <h2 className="display-xl mt-4 text-4xl sm:text-5xl md:text-6xl">Explore every persona</h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
            Slide the clock from June 1 toward The Degens&rsquo; June 30 show in Detroit. Same
            codebase as production — seeded demo data, real fan app and Artist Studio.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ClaimLabel kind="demo" />
          </div>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 rounded-xl px-6 text-sm font-semibold uppercase tracking-[0.16em]"
          >
            <Link href="/demo">Open demo board</Link>
          </Button>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <div className="deck-card rounded-2xl border-white/10 bg-[#121212] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/8 pb-4">
              <p className="font-display text-lg tracking-wide">Demo board</p>
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Jun 30 · Detroit</span>
            </div>

            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Jun 1</span>
                <span>Jun 30</span>
              </div>
              <div className="relative h-2 rounded-full bg-white/10">
                <div className="absolute left-[72%] top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-[#121212] bg-primary shadow-[0_0_12px_rgba(123,60,255,0.6)]" />
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-primary/40 to-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Doors · verification · encore · post-show window</p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {PERSONAS.map((persona) => {
                const Icon = persona.icon;
                return (
                  <li
                    key={persona.label}
                    className={`flex items-start gap-3 rounded-xl border p-3 ${persona.accent}`}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold">{persona.label}</p>
                      <p className="text-[11px] opacity-80">{persona.role}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

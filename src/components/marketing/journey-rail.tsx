import Image from "next/image";
import {
  BadgeCheck,
  CalendarDays,
  Disc3,
  QrCode,
  ShoppingBag,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { JOURNEY_STEPS } from "@/components/marketing/marketing-fixtures";
import { THE_DEGENS_DEMO_ASSETS } from "@/lib/the-degens-demo-assets";
import { ScrollReveal } from "@/components/marketing/visual/scroll-reveal";
import { cn } from "@/lib/utils";

const STEP_ICONS = [Sparkles, QrCode, BadgeCheck, ShoppingBag, UserCheck, CalendarDays, Disc3] as const;

const STEP_VISUALS: Record<string, { src?: string; label: string }> = {
  "02": { label: "Venue QR" },
  "03": { src: THE_DEGENS_DEMO_ASSETS.dropPosters["detroit-tonight"], label: "Artist Takeover" },
  "04": { src: THE_DEGENS_DEMO_ASSETS.products.prd_av_detroit_tee, label: "Encore tee" },
};

export function JourneyRail({
  expanded = false,
  className,
}: {
  expanded?: boolean;
  className?: string;
}) {
  return (
    <ol
      className={cn(
        expanded ? "grid gap-6 md:grid-cols-2" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7",
        className,
      )}
    >
      {JOURNEY_STEPS.map((step, index) => {
        const Icon = STEP_ICONS[index] ?? Sparkles;
        const visual = STEP_VISUALS[step.n];

        return (
          <ScrollReveal key={step.n} delay={index * 60}>
            <li className="relative h-full">
              <div
                className={cn(
                  "deck-card flex h-full flex-col rounded-2xl border-white/8 bg-[#161618] p-5",
                  expanded && "md:min-h-[220px]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <p className="font-display text-2xl text-primary/70">{step.n}</p>
                </div>
                {visual?.src ? (
                  <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-lg border border-white/8 bg-[#0d0d0f]">
                    <Image src={visual.src} alt="" fill sizes="120px" className="object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/80">
                      {visual.label}
                    </span>
                  </div>
                ) : visual ? (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-white/10 px-3 py-4 text-xs text-muted-foreground">
                    <QrCode className="size-4 shrink-0 text-primary" aria-hidden />
                    {visual.label}
                  </div>
                ) : null}
                <h3 className="mt-3 font-display text-xl md:text-2xl">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                {expanded ? (
                  <p className="mt-4 text-sm leading-relaxed text-foreground/80">{step.detail}</p>
                ) : null}
              </div>
            </li>
          </ScrollReveal>
        );
      })}
    </ol>
  );
}

import Image from "next/image";
import { BadgeCheck, Lock, MapPin, Sparkles, Timer } from "lucide-react";
import { ArtistThemeScope } from "@/components/artist/artist-takeover";
import { ClaimLabel } from "@/components/marketing/claim-label";
import { DeviceFrame } from "@/components/marketing/device-frame";
import { THE_DEGENS_THEME, EXCLUSIVITY_TYPES } from "@/components/marketing/marketing-fixtures";
import { ScrollReveal } from "@/components/marketing/visual/scroll-reveal";
import { THE_DEGENS_DEMO_ASSETS } from "@/lib/the-degens-demo-assets";
import { cn } from "@/lib/utils";

export function TakeoverPhone({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative mx-auto min-h-[28rem] max-w-md sm:min-h-[32rem]">
        <ScrollReveal>
          <DeviceFrame label="Credential" className="relative z-10 mx-auto max-w-[260px]">
            <CredentialMini />
          </DeviceFrame>
        </ScrollReveal>
        <ScrollReveal delay={100} className="absolute -right-2 top-16 z-20 sm:right-0">
          <DeviceFrame label="Attendee drop" className="mx-auto max-w-[240px] scale-95 opacity-95">
            <DropMini />
          </DeviceFrame>
        </ScrollReveal>
        <ScrollReveal delay={200} className="absolute -left-2 bottom-0 z-0 sm:left-0">
          <DeviceFrame label="Encore window" className="mx-auto max-w-[220px] scale-90 opacity-80">
            <EncoreMini />
          </DeviceFrame>
        </ScrollReveal>
      </div>
    </div>
  );
}

export function ExclusivityList({ className }: { className?: string }) {
  const icons = [MapPin, Lock, Timer, Sparkles, BadgeCheck] as const;

  return (
    <ul className={cn("space-y-3", className)}>
      {EXCLUSIVITY_TYPES.map((item, index) => {
        const Icon = icons[index] ?? Lock;
        return (
          <li
            key={item.label}
            className="deck-card flex items-center gap-3 rounded-xl border-white/8 bg-[#161618] px-4 py-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="font-display text-xl">{item.label}</span>
            {item.live ? (
              <span className="ml-auto rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
                Live
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function CredentialMini() {
  return (
    <ArtistThemeScope theme={THE_DEGENS_THEME}>
      <div className="space-y-3 bg-artist-bg px-4 pb-5 pt-8">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-artist-muted">
          I was there
        </p>
        <div className="rounded-xl border border-artist-border bg-artist-surface p-3">
          <p className="font-artist text-lg text-artist-fg">The Degens · Detroit</p>
          <div className="mt-2 flex items-center gap-1.5 text-artist-accent">
            <BadgeCheck className="size-4" aria-hidden />
            <span className="text-xs">Verified</span>
          </div>
        </div>
      </div>
    </ArtistThemeScope>
  );
}

function DropMini() {
  return (
    <ArtistThemeScope theme={THE_DEGENS_THEME}>
      <div className="relative min-h-[280px] overflow-hidden bg-artist-bg px-4 pb-5 pt-8">
        <Image
          src={THE_DEGENS_DEMO_ASSETS.cityDetroit}
          alt=""
          fill
          sizes="240px"
          className="object-cover opacity-25"
        />
        <div className="relative space-y-3">
          <p className="font-display text-3xl text-artist-fg">Detroit.</p>
          <div className="rounded-xl border border-brand-pink/40 bg-black/50 p-3">
            <p className="eyebrow text-brand-pink">Attendee drop</p>
            <div className="mt-2 flex items-center gap-2">
              <Image
                src={THE_DEGENS_DEMO_ASSETS.products.prd_av_detroit_tee}
                alt=""
                width={48}
                height={48}
                className="rounded-lg border border-artist-border object-cover"
              />
              <p className="text-sm text-artist-fg">Detroit Encore Tee</p>
            </div>
          </div>
        </div>
      </div>
    </ArtistThemeScope>
  );
}

function EncoreMini() {
  return (
    <ArtistThemeScope theme={THE_DEGENS_THEME}>
      <div className="space-y-3 bg-artist-bg px-4 pb-5 pt-8">
        <div className="flex items-center justify-between">
          <p className="eyebrow text-artist-accent">Encore drop</p>
          <ClaimLabel kind="framing" className="scale-90 border-artist-accent/30 text-artist-accent" />
        </div>
        <p className="font-artist text-2xl text-artist-fg">Opens when the encore hits</p>
        <p className="flex items-center gap-1 text-sm text-artist-muted">
          <Timer className="size-3.5" aria-hidden />
          Closes when the timer does
        </p>
      </div>
    </ArtistThemeScope>
  );
}

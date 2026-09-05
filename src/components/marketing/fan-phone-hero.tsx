import { Bell, CalendarDays, Disc3, Radio, ShoppingBag, User } from "lucide-react";
import { CredentialCard } from "@/components/fan/credential-card";
import { ArtistThemeScope } from "@/components/artist/artist-takeover";
import { RollingGaMark } from "@/components/brand/rolling-ga-mark";
import { DeviceFrame } from "@/components/marketing/device-frame";
import {
  THE_DEGENS_THEME,
  DETROIT_CREDENTIAL,
  HERO_UNLOCK,
} from "@/components/marketing/marketing-fixtures";

const TABS = [
  { label: "Live", icon: Radio, active: true },
  { label: "Drops", icon: Disc3, active: false },
  { label: "My Shows", icon: CalendarDays, active: false },
  { label: "Profile", icon: User, active: false },
] as const;

export function FanPhoneHero({ className }: { className?: string }) {
  return (
    <DeviceFrame className={className} label="Live">
      <div className="flex h-[34rem] flex-col bg-[#121212]">
        <div
          className="flex items-center justify-between px-6 pt-3 text-[10px] font-medium text-muted-foreground"
          aria-hidden
        >
          <span>9:41</span>
          <span>5G</span>
        </div>

        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/8 px-3">
          <div className="min-w-0 flex-1">
            <RollingGaMark size="sm" />
          </div>
          <span className="flex size-7 items-center justify-center text-muted-foreground">
            <Bell className="size-3.5" aria-hidden />
          </span>
          <span className="flex size-7 items-center justify-center text-muted-foreground">
            <ShoppingBag className="size-3.5" aria-hidden />
          </span>
          <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold">
            PN
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <ArtistThemeScope theme={THE_DEGENS_THEME}>
            <div className="space-y-3 bg-artist-bg px-3 pb-4 pt-4">
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-artist-muted">
                I was there
              </p>
              <CredentialCard credential={DETROIT_CREDENTIAL} theme={THE_DEGENS_THEME} />
              <div className="rounded-2xl border border-artist-border bg-artist-surface px-4 py-3">
                <p className="eyebrow text-artist-accent">{HERO_UNLOCK.eyebrow}</p>
                <p className="mt-1 font-artist text-lg text-artist-fg">{HERO_UNLOCK.title}</p>
                <p className="text-sm text-artist-muted">
                  {HERO_UNLOCK.product} · {HERO_UNLOCK.price}
                </p>
              </div>
            </div>
          </ArtistThemeScope>
        </div>

        <nav className="flex shrink-0 border-t border-white/10" aria-hidden>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.label}
                className={`relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[8px] font-semibold uppercase tracking-wider ${
                  tab.active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.active && (
                  <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />
                )}
                <Icon className="size-4" />
                {tab.label}
              </div>
            );
          })}
        </nav>
      </div>
    </DeviceFrame>
  );
}

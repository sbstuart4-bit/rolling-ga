import Image from "next/image";
import { ArtistThemeScope } from "@/components/artist/artist-takeover";
import { DeviceFrame } from "@/components/marketing/device-frame";
import { THE_DEGENS_THEME, EXCLUSIVITY_TYPES } from "@/components/marketing/marketing-fixtures";
import { THE_DEGENS_DEMO_ASSETS } from "@/lib/the-degens-demo-assets";
import { cn } from "@/lib/utils";

/**
 * One phone, not a stack of three.
 *
 * The overlapping collage buried the copy on each card underneath the next
 * device, and three mockups do not say more than one does. The attendee drop is
 * the frame that carries "only if you were there".
 */
export function TakeoverPhone({ className }: { className?: string }) {
  return (
    <div className={className}>
      <DeviceFrame label="Attendee drop" className="mx-auto max-w-[290px]">
        <DropMini />
      </DeviceFrame>
    </div>
  );
}

export function ExclusivityList({ className }: { className?: string }) {
  return (
    <ul className={cn("max-w-md", className)}>
      {EXCLUSIVITY_TYPES.map((item) => (
        <li
          key={item.label}
          className="flex items-baseline justify-between gap-6 border-t border-world-rule py-4"
        >
          <span className="mk-display text-lg">{item.label}</span>
          {item.live ? <span className="mk-kicker text-world-muted">Live</span> : null}
        </li>
      ))}
    </ul>
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

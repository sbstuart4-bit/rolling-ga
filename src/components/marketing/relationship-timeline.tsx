import Image from "next/image";
import { BadgeCheck, Link2, ShoppingBag } from "lucide-react";
import { RELATIONSHIP_BEATS } from "@/components/marketing/marketing-fixtures";
import { THE_DEGENS_DEMO_ASSETS } from "@/lib/the-degens-demo-assets";
import { ScrollReveal } from "@/components/marketing/visual/scroll-reveal";

const BEAT_THUMBS: Record<string, { src?: string; icon?: "badge" | "cart" | "link" }> = {
  "I was there": { icon: "badge" },
  "Show-night merch": { src: THE_DEGENS_DEMO_ASSETS.products.prd_av_detroit_tee },
  "Permission granted": { icon: "link" },
  "Detroit attendee drop": { src: THE_DEGENS_DEMO_ASSETS.dropPosters["detroit-encore"] },
  "Post-show commerce": { src: THE_DEGENS_DEMO_ASSETS.products.prd_av_hoodie },
  "Anniversary access": { src: "/demo/poster-austin-anniversary.svg" },
  "Returning fan access": { icon: "badge" },
};

export function RelationshipTimeline() {
  return (
    <div>
      <ScrollReveal>
        <div className="mb-16 text-center">
          <p className="font-display text-7xl leading-none sm:text-8xl md:text-9xl">3 hours</p>
          <p className="my-6 font-display text-4xl text-muted-foreground" aria-hidden>
            ↓
          </p>
          <p className="font-display text-7xl leading-none text-primary sm:text-8xl md:text-9xl">Years</p>
        </div>
      </ScrollReveal>
      <p className="mb-12 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
        One concert can create more than one transaction.
      </p>
      <ol className="relative space-y-0 border-l border-white/10 pl-8">
        {RELATIONSHIP_BEATS.map((beat, index) => {
          const thumb = BEAT_THUMBS[beat.title];

          return (
            <ScrollReveal key={beat.kicker} delay={index * 70}>
              <li className="relative pb-10 last:pb-0">
                <span
                  className="absolute -left-[37px] top-1.5 size-3 rounded-full border-2 border-[#121212] bg-primary"
                  aria-hidden
                />
                <div className="flex gap-4">
                  <BeatThumb thumb={thumb} />
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow text-primary">{beat.kicker}</p>
                    <h3 className="mt-2 font-display text-2xl">{beat.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{beat.detail}</p>
                  </div>
                </div>
              </li>
            </ScrollReveal>
          );
        })}
      </ol>
    </div>
  );
}

function BeatThumb({ thumb }: { thumb?: { src?: string; icon?: "badge" | "cart" | "link" } }) {
  if (!thumb) return null;

  if (thumb.src) {
    return (
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-[#0d0d0f]">
        <Image src={thumb.src} alt="" fill sizes="56px" className="object-cover" />
      </div>
    );
  }

  const Icon = thumb.icon === "cart" ? ShoppingBag : thumb.icon === "link" ? Link2 : BadgeCheck;

  return (
    <span className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
      <Icon className="size-6" aria-hidden />
    </span>
  );
}

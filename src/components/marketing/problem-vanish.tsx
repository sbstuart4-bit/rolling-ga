import Image from "next/image";
import { ClaimLabel } from "@/components/marketing/claim-label";
import { THE_DEGENS_DEMO_ASSETS } from "@/lib/the-degens-demo-assets";
import { PosterCollage } from "@/components/marketing/visual/poster-collage";
import { ScrollReveal } from "@/components/marketing/visual/scroll-reveal";

const BEATS = [
  { title: "5,000 people attend.", detail: "A sold-out room. Full intent." },
  { title: "They buy drinks.", detail: "The night spends itself in the building." },
  { title: "Some buy merch.", detail: "Whoever reaches the table in time." },
  { title: "They leave.", detail: "The emotion walks out with them." },
] as const;

export function ProblemVanish() {
  return (
    <div className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr]">
      <ScrollReveal>
        <div className="relative">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <p className="font-display text-7xl leading-none sm:text-8xl">5,000</p>
            <ClaimLabel kind="illustrative" />
          </div>
          <div className="relative mx-auto aspect-[4/5] max-w-sm">
            <PosterCollage
              className="size-full"
              layers={[
                {
                  src: THE_DEGENS_DEMO_ASSETS.dropPosters["detroit-tonight"],
                  className: "inset-[8%] z-0 rotate-[-4deg] opacity-90",
                },
                {
                  src: THE_DEGENS_DEMO_ASSETS.tourHero,
                  className: "inset-[18%_10%_10%_18%] z-[1] rotate-[3deg] opacity-70",
                },
              ]}
            />
            <CrowdFadeGrid />
          </div>
          <p className="mt-6 text-center text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Intent fades when the room empties
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={120}>
        <ol className="grid gap-4 sm:grid-cols-2">
          {BEATS.map((beat, index) => (
            <li
              key={beat.title}
              className="deck-card rounded-2xl border-white/8 bg-[#161618] p-5"
              style={{ opacity: 1 - index * 0.1 }}
            >
              <p className="font-display text-[10px] text-primary">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 text-lg font-medium leading-snug">{beat.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{beat.detail}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-xl text-lg text-muted-foreground">
          Tomorrow the artist starts over in another city. The show created enormous fan intent and
          emotion, but most of that relationship disappears when people leave the venue.
        </p>
        <p className="mt-6 font-display text-3xl text-primary sm:text-4xl">Rolling GA changes that.</p>
      </ScrollReveal>
    </div>
  );
}

function CrowdFadeGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 grid grid-cols-10 gap-1 px-4 pb-6"
      aria-hidden
    >
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="aspect-[3/4] rounded-sm bg-white/20 animate-float-subtle"
          style={{
            opacity: Math.max(0.08, 0.55 - (i % 10) * 0.05 - Math.floor(i / 10) * 0.08),
            animationDelay: `${(i % 8) * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

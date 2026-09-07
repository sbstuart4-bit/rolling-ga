import Link from "next/link";
import { getActiveArtistGuidedDemoContext } from "@/server/demo/artist-guided-demo-state";

export async function ArtistGuidedDemoHighlight() {
  const ctx = await getActiveArtistGuidedDemoContext();
  if (!ctx) return null;

  const { step, journey } = ctx;

  if (step.step === 1) {
    return (
      <div className="mb-6 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/80 to-zinc-950 px-6 py-5 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">
          Marisol Reyes
        </p>
        <h2 className="mt-1 font-display text-2xl tracking-wide md:text-3xl">A Tender Night</h2>
        <p className="mt-1 text-sm text-violet-100/80">Brooklyn · June 12, 2026</p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300">
          Tonight&apos;s show is a live commerce and relationship event — attendance, connected
          fans, purchasing fans and merch GMV update as the room fills.
        </p>
      </div>
    );
  }

  if (step.isConclusion) {
    return (
      <div className="mb-8 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/90 via-zinc-950 to-black px-6 py-8 text-center text-white md:px-10 md:py-10">
        <p className="font-display text-[clamp(1.75rem,5vw,2.75rem)] leading-tight tracking-wide">
          The show ends.
        </p>
        <p className="font-display text-[clamp(1.75rem,5vw,2.75rem)] leading-tight tracking-wide text-violet-300">
          The relationship doesn&apos;t.
        </p>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-zinc-300">
          Rolling GA turns a night of live music into an audience the artist can know, serve and
          grow.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/studio/insights"
            className="inline-flex items-center justify-center rounded-full bg-violet-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-violet-400"
          >
            Explore Artist Studio
          </Link>
          <Link
            href="/pilot#conversation"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/5"
          >
            Run a pilot
          </Link>
        </div>
      </div>
    );
  }

  if (step.keyMessage) {
    return (
      <div className="mb-6 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
          {journey.subtitle}
        </p>
        <p className="mt-1 text-sm font-medium leading-relaxed">{step.keyMessage}</p>
      </div>
    );
  }

  return null;
}

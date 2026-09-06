import Link from "next/link";
import { ExperienceDegensForm } from "@/components/marketing/experience-degens-form";
import { MarketingWorld } from "@/components/marketing/marketing-world";
import { DEGENS_DETROIT_JOURNEY } from "@/lib/guided-demo";

/**
 * BEAT 6 — GO TO THE SHOW
 *
 * Convert on the product rather than on a feature list. Black, one line, one
 * button. The duration comes from the journey definition so the page cannot
 * promise a length the demo does not keep.
 */
export function BeatSix() {
  return (
    <MarketingWorld world="rga" id="go-to-the-show" className="border-t border-world-rule">
      <div className="mx-auto max-w-[100rem] px-5 py-28 sm:px-8 md:py-40">
        <h2 className="mk-display mk-display-tight max-w-4xl text-[clamp(2.5rem,9vw,8rem)]">
          Don&rsquo;t read about it.
          <br />
          Go to the show.
        </h2>

        <p className="mk-body mt-10 max-w-2xl text-lg text-world-muted">
          {DEGENS_DETROIT_JOURNEY.durationLabel}. One fan, one night in Detroit. The real product
          &mdash; not a video.
        </p>

        <ExperienceDegensForm
          className="mt-14"
          size="large"
          secondary={{ href: "/demo", label: "Explore the demo" }}
        />

        <p className="mk-body mt-12 max-w-lg text-sm text-world-muted">
          For managers and merch teams &mdash;{" "}
          <Link href="/for-artists" className="text-world-fg underline underline-offset-4">
            see the artist side
          </Link>
          , or{" "}
          <Link href="/pilot" className="text-world-fg underline underline-offset-4">
            talk to us about a tour leg
          </Link>
          .
        </p>

        <p className="mk-display mk-display-tight mt-32 max-w-3xl text-[clamp(1.75rem,5vw,4rem)] text-world-muted md:mt-44">
          The show ends.
          <br />
          <span className="text-world-fg">The relationship doesn&rsquo;t have to.</span>
        </p>
      </div>
    </MarketingWorld>
  );
}

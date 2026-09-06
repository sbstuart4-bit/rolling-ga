import { ExperienceDegensForm } from "@/components/marketing/experience-degens-form";
import { MarketingWorld } from "@/components/marketing/marketing-world";
import { BeatMarker } from "./beat-marker";
import { RoomStage } from "./room-stage";

/**
 * BEAT 1 — THE ROOM FRAGMENTS
 *
 * Two frames. The show, which drains as you scroll; then the aftermath, where
 * Rolling GA states the thesis in its own quiet voice. The call to action lives
 * in the second frame rather than inside the scroll, so it can be read and
 * clicked without fighting the animation.
 */
export function BeatOne() {
  return (
    <>
      <MarketingWorld world="degens" id="the-night" className="isolate overflow-x-clip">
        <RoomStage />
      </MarketingWorld>

      <MarketingWorld world="rga" className="border-t border-world-rule">
        <div className="mx-auto max-w-[100rem] px-5 pb-28 pt-14 sm:px-8 md:pb-36 md:pt-20">
          <BeatMarker n="01" label="The night" className="max-w-5xl" />
          <div className="max-w-5xl">
            <h2 className="mk-display mt-12 text-[clamp(2.25rem,7.5vw,6.25rem)]">
              The show is the beginning of the relationship.
            </h2>
            <p className="mk-body mt-10 max-w-2xl text-lg leading-relaxed text-world-muted md:text-xl">
              Rolling GA makes being there provable &mdash; and turns that night into merch, memory
              and a relationship that continues after load-out.
            </p>
            <ExperienceDegensForm
              className="mt-14"
              size="large"
              secondary={{ href: "/for-artists", label: "See the artist side" }}
            />
          </div>
        </div>
      </MarketingWorld>
    </>
  );
}

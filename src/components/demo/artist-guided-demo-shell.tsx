import type { ReactNode } from "react";
import { ArtistGuidedDemoPanel } from "@/components/demo/artist-guided-demo-panel";
import {
  artistGuidedStepContextSummary,
  getActiveArtistGuidedDemoContext,
} from "@/server/demo/artist-guided-demo-state";

export async function ArtistGuidedDemoShell({ children }: { children: ReactNode }) {
  const ctx = await getActiveArtistGuidedDemoContext();
  if (!ctx) return <>{children}</>;

  const context = artistGuidedStepContextSummary(ctx.step);

  return (
    <div className="min-h-dvh xl:flex xl:gap-5 xl:bg-[#070708] xl:p-4">
      <div className="min-w-0 flex-1">{children}</div>
      <div className="hidden xl:order-2 xl:block xl:w-[min(22rem,calc(100vw-28rem))] xl:shrink-0">
        <ArtistGuidedDemoPanel
          journey={ctx.journey}
          step={ctx.step}
          session={ctx.session}
          totalSteps={ctx.journey.steps.length}
          timeLabel={context.timeLabel}
          showLabel={context.showLabel}
        />
      </div>
    </div>
  );
}

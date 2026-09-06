"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exitGuidedDemoAction } from "@/server/demo/guided-demo-actions";
import {
  type GuidedDemoChromeProps,
  GuidedDemoDetailContent,
  GuidedDemoStepNav,
  GuidedDemoAuxControls,
  useGuidedDemoAutoplay,
  useGuidedDemoToggles,
  useGuidedDemoUrlSync,
} from "@/components/demo/guided-demo-shared";

export function GuidedDemoPanel(props: GuidedDemoChromeProps) {
  const { journey, step, session, totalSteps } = props;
  const [paused, setPaused] = React.useState(false);

  useGuidedDemoUrlSync();
  useGuidedDemoAutoplay(session, paused);
  const { toggleAutoplay, togglePresenter } = useGuidedDemoToggles(session);

  return (
    <aside
      className={cn(
        "guided-demo-panel hidden flex-col border-border bg-[#0f0f10] text-foreground md:flex",
        "max-h-[min(52rem,calc(100dvh-2rem))] w-full overflow-hidden rounded-2xl border border-border/80",
      )}
      aria-label="Guided demo narration"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Guided demo
          </p>
          <p className="truncate text-sm font-medium">{journey.title}</p>
        </div>
        <form action={exitGuidedDemoAction}>
          <Button type="submit" variant="ghost" size="icon-sm" aria-label="Exit guided demo">
            <X className="size-4" />
          </Button>
        </form>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <GuidedDemoDetailContent {...props} />
      </div>

      <div className="space-y-2 border-t border-border/60 px-4 py-3">
        <GuidedDemoStepNav session={session} step={step} totalSteps={totalSteps} />
        <GuidedDemoAuxControls
          session={session}
          paused={paused}
          onPauseToggle={() => setPaused((p) => !p)}
          onAutoplayToggle={toggleAutoplay}
          onPresenterToggle={togglePresenter}
        />
      </div>
    </aside>
  );
}

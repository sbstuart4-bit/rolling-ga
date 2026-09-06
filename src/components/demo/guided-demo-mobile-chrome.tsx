"use client";

import * as React from "react";
import { ChevronUp } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { exitGuidedDemoAction } from "@/server/demo/guided-demo-actions";
import { Button } from "@/components/ui/button";
import {
  type GuidedDemoChromeProps,
  GuidedDemoDetailContent,
  GuidedDemoStepNav,
  GuidedDemoAuxControls,
  useGuidedDemoAutoplay,
  useGuidedDemoToggles,
  useGuidedDemoUrlSync,
} from "@/components/demo/guided-demo-shared";

export function GuidedDemoMobileChrome(props: GuidedDemoChromeProps) {
  const { step, session, totalSteps } = props;
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [paused, setPaused] = React.useState(false);

  useGuidedDemoUrlSync();
  useGuidedDemoAutoplay(session, paused);
  const { toggleAutoplay, togglePresenter } = useGuidedDemoToggles(session);

  const stepLine = `Step ${step.step}/${totalSteps} · ${step.title}`;

  return (
    <>
      <div
        className="shrink-0 border-t border-border bg-[#0f0f10]/95 backdrop-blur-lg md:hidden"
        aria-label="Guided demo controls"
      >
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left"
          aria-expanded={sheetOpen}
        >
          <p className="min-w-0 flex-1 truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground">
            {stepLine}
          </p>
          <ChevronUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>

        <div className="border-t border-border/60 px-3 pb-2 pt-1">
          <GuidedDemoStepNav
            session={session}
            step={step}
            totalSteps={totalSteps}
            compact
          />
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[min(85dvh,640px)] overflow-y-auto rounded-t-2xl border-border bg-[#0f0f10] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:hidden"
        >
          <SheetHeader className="border-b border-border/60 pb-3 text-left">
            <SheetTitle className="font-display text-lg tracking-wide">{step.title}</SheetTitle>
            <SheetDescription className="text-xs uppercase tracking-wider">
              Guided demo · Step {step.step} of {totalSteps}
            </SheetDescription>
          </SheetHeader>

          <div className="overflow-y-auto px-4 py-4">
            <GuidedDemoDetailContent
              {...props}
              showAuxControls
              paused={paused}
              onPauseToggle={() => setPaused((p) => !p)}
              onAutoplayToggle={toggleAutoplay}
              onPresenterToggle={togglePresenter}
            />
          </div>

          <div className="border-t border-border/60 px-4 py-3">
            <form action={exitGuidedDemoAction}>
              <Button type="submit" variant="ghost" className="w-full text-xs uppercase tracking-wider">
                Exit guided demo
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

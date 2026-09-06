import type { ReactNode } from "react";
import { GuidedDemoPanel } from "@/components/demo/guided-demo-panel";
import {
  getActiveGuidedDemoContext,
  guidedStepMerchLabel,
} from "@/server/demo/guided-demo-state";

export async function GuidedDemoShell({ children }: { children: ReactNode }) {
  const ctx = await getActiveGuidedDemoContext();
  if (!ctx) return <>{children}</>;

  const merchLabel = guidedStepMerchLabel(ctx.step);

  return (
    <div className="min-h-dvh bg-[#070708] md:flex md:items-center md:justify-center md:gap-6 md:p-6">
      <GuidedDemoPanel
        journey={ctx.journey}
        step={ctx.step}
        session={ctx.session}
        totalSteps={ctx.journey.steps.length}
        merchLabel={merchLabel}
      />
      <div className="min-h-0 flex-1 md:flex md:justify-center">{children}</div>
    </div>
  );
}

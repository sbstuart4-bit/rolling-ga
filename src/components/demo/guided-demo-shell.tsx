import type { ReactNode } from "react";
import { GuidedDemoPanel } from "@/components/demo/guided-demo-panel";
import {
  getActiveGuidedDemoContext,
  guidedStepContextSummary,
} from "@/server/demo/guided-demo-state";

export async function GuidedDemoShell({ children }: { children: ReactNode }) {
  const ctx = await getActiveGuidedDemoContext();
  if (!ctx) return <>{children}</>;

  const context = guidedStepContextSummary(ctx.step);

  return (
    <div className="flex min-h-dvh flex-col bg-[#070708] md:flex-row md:items-center md:justify-center md:gap-5 md:p-4">
      <div className="order-1 flex min-h-0 flex-1 items-start justify-center md:order-2 md:min-w-[440px] md:flex-[1.35] md:items-center">
        {children}
      </div>
      <div className="order-2 shrink-0 md:order-1 md:w-[min(22rem,calc(100vw-28rem))]">
        <GuidedDemoPanel
          journey={ctx.journey}
          step={ctx.step}
          session={ctx.session}
          totalSteps={ctx.journey.steps.length}
          accessLabel={context.accessLabel}
          timeLabel={context.timeLabel}
          fanLabel={context.fanLabel}
          locationLabel={context.locationLabel}
          credentialLabel={context.credentialLabel}
          purchaseLabel={context.purchaseLabel}
        />
      </div>
    </div>
  );
}

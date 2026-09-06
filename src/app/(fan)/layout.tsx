import { redirect } from "next/navigation";
import { FanAppShell } from "@/components/fan/fan-app-shell";
import { GuidedDemoShell } from "@/components/demo/guided-demo-shell";
import { getActiveGuidedDemoContext } from "@/server/demo/guided-demo-state";
import { syncGuidedDemoClock } from "@/server/demo/guided-demo-apply";
import { hydrateDemoClockFromCookie } from "@/server/demo/clock";
import { requireAuth } from "@/server/auth/request";
import { countCartItems } from "@/server/commerce/cart";
import { fanHasLiveVerifiedShow } from "@/server/fans/live-tab";

/**
 * The fan surface is a phone app: edge-to-edge on a device, device-framed
 * on desktop so Live never becomes a website layout.
 */
export default async function FanLayout({ children }: LayoutProps<"/">) {
  const ctx = await requireAuth();

  // New fans (created via /sign-up, not the seeded demo accounts) finish the
  // onboarding wizard before they see any fan surface.
  if (ctx.roles.includes("fan") && !ctx.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const [cartCount, liveVerifiedShow, guidedDemo] = await Promise.all([
    countCartItems(ctx.userId),
    fanHasLiveVerifiedShow(ctx.userId),
    getActiveGuidedDemoContext(),
  ]);

  await hydrateDemoClockFromCookie();
  if (guidedDemo) {
    syncGuidedDemoClock(guidedDemo);
  }

  return (
    <GuidedDemoShell>
      <FanAppShell
        displayName={ctx.displayName}
        cartCount={cartCount}
        liveVerifiedShow={liveVerifiedShow}
        presentation={guidedDemo ? "guided" : "default"}
      >
        <main className="min-h-full">{children}</main>
      </FanAppShell>
    </GuidedDemoShell>
  );
}

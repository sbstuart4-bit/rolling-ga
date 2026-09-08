import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { FanAppShell } from "@/components/fan/fan-app-shell";
import { GuidedDemoAuthGate } from "@/components/demo/guided-demo-auth-gate";
import { GuidedDemoMobileChromeGate } from "@/components/demo/guided-demo-mobile-chrome-gate";
import { GuidedDemoShell } from "@/components/demo/guided-demo-shell";
import {
  getActiveGuidedDemoContext,
  guidedStepContextSummary,
} from "@/server/demo/guided-demo-state";
import { isScottDemoSession, syncGuidedDemoClock } from "@/server/demo/guided-demo-apply";
import { hydrateDemoClockFromCookie } from "@/server/demo/clock";
import { requireAuth } from "@/server/auth/request";
import { getAuthContext } from "@/server/auth/session";
import { countCartItems } from "@/server/commerce/cart";
import { fanHasLiveVerifiedShow } from "@/server/fans/live-tab";
import {
  GUIDED_DEMO_ENTRY_HEADER,
  parseGuidedDemoQuery,
} from "@/lib/guided-demo-entry";

async function parseGuidedEntryFromHeaders(): Promise<{
  guided: string;
  step: string;
  presenter?: string;
  autoplay?: string;
} | null> {
  const headerStore = await headers();
  const guidedEntry = headerStore.get(GUIDED_DEMO_ENTRY_HEADER);
  if (!guidedEntry) return null;

  try {
    const parsed = parseGuidedDemoQuery(new URL(guidedEntry, "http://local").searchParams);
    if (!parsed || parsed.perspective !== "fan") return null;
    return {
      guided: parsed.journeyId,
      step: String(parsed.step),
      presenter: parsed.presenter ? "1" : undefined,
      autoplay: parsed.autoplay ? "1" : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * The fan surface is a phone app: edge-to-edge on a device, device-framed
 * on desktop so Live never becomes a website layout.
 */
export default async function FanLayout({ children }: LayoutProps<"/">) {
  const pendingGuided = await parseGuidedEntryFromHeaders();
  const existingAuth = await getAuthContext();
  if (pendingGuided && (!existingAuth || !isScottDemoSession(existingAuth))) {
    return <GuidedDemoAuthGate {...pendingGuided} />;
  }

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

  const guidedContext = guidedDemo ? guidedStepContextSummary(guidedDemo.step) : null;

  return (
    <GuidedDemoShell>
      <FanAppShell
        displayName={ctx.displayName}
        cartCount={cartCount}
        liveVerifiedShow={liveVerifiedShow}
        presentation={guidedDemo ? "guided" : "default"}
        guidedMobileChrome={
          guidedDemo && guidedContext ? (
            <GuidedDemoMobileChromeGate
              journey={guidedDemo.journey}
              step={guidedDemo.step}
              session={guidedDemo.session}
              totalSteps={guidedDemo.journey.steps.length}
              accessLabel={guidedContext.accessLabel}
              timeLabel={guidedContext.timeLabel}
              fanLabel={guidedContext.fanLabel}
              locationLabel={guidedContext.locationLabel}
              credentialLabel={guidedContext.credentialLabel}
              purchaseLabel={guidedContext.purchaseLabel}
            />
          ) : undefined
        }
      >
        <main className="min-h-full">{children}</main>
      </FanAppShell>
    </GuidedDemoShell>
  );
}

import { redirect } from "next/navigation";
import { FanAppShell } from "@/components/fan/fan-app-shell";
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

  const [cartCount, liveVerifiedShow] = await Promise.all([
    countCartItems(ctx.userId),
    fanHasLiveVerifiedShow(ctx.userId),
  ]);

  return (
    <FanAppShell displayName={ctx.displayName} cartCount={cartCount} liveVerifiedShow={liveVerifiedShow}>
      <main className="min-h-full">{children}</main>
    </FanAppShell>
  );
}

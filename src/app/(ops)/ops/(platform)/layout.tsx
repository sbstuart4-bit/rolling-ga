import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PlatformOpsShell } from "@/components/ops/platform-ops-shell";
import { demoModeEnabled } from "@/lib/demo-mode";
import { getAuthContext } from "@/server/auth/session";
import { requireAuthWithRole } from "@/server/auth/request";

async function PlatformOpsAuth({ children }: { children: React.ReactNode }) {
  let userName = "Demo operator";

  if (demoModeEnabled()) {
    const ctx = await getAuthContext();
    if (ctx) userName = ctx.displayName;
  } else {
    const ctx = await requireAuthWithRole(["rga_admin"], "/ops");
    userName = ctx.displayName;
  }

  return (
    <PlatformOpsShell userName={userName} demoMode={demoModeEnabled()}>
      {children}
    </PlatformOpsShell>
  );
}

export default async function PlatformOpsLayout({ children }: LayoutProps<"/ops">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#0c0e12]" />}>
      <PlatformOpsAuth>{children}</PlatformOpsAuth>
    </Suspense>
  );
}

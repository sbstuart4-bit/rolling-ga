import { OpsCommandShell } from "@/components/ops/ops-command-shell";
import { demoModeEnabled } from "@/lib/demo-mode";
import { requireAuthWithRole } from "@/server/auth/request";

export default async function FulfillmentOpsLayout({ children }: LayoutProps<"/ops">) {
  const ctx = await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops");
  return (
    <OpsCommandShell userName={ctx.displayName} demoMode={demoModeEnabled()}>
      {children}
    </OpsCommandShell>
  );
}

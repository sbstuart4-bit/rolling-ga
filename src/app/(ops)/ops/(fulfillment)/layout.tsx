import { OpsShell } from "@/components/ops/ops-shell";
import { demoModeEnabled } from "@/lib/demo-mode";
import { requireAuthWithRole } from "@/server/auth/request";

export default async function FulfillmentOpsLayout({ children }: LayoutProps<"/ops">) {
  const ctx = await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops");
  return (
    <OpsShell userName={ctx.displayName} demoMode={demoModeEnabled()}>
      {children}
    </OpsShell>
  );
}

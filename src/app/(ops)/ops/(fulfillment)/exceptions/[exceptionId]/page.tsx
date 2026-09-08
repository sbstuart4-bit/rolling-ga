import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpsExceptionDetail } from "@/components/ops/ops-exception-detail";
import { demoModeEnabled } from "@/lib/demo-mode";
import { requireAuthWithRole } from "@/server/auth/request";
import { ensureOpsDemoClock } from "@/server/ops/demo-clock";
import { loadExceptionWorkbench } from "@/server/ops/exception-queries";

export const metadata: Metadata = { title: "Exception — Rolling GA Ops" };
export const dynamic = "force-dynamic";

export default async function OpsExceptionDetailPage({
  params,
}: {
  params: Promise<{ exceptionId: string }>;
}) {
  const ctx = await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops/exceptions");
  if (demoModeEnabled()) {
    await ensureOpsDemoClock();
  }

  const { exceptionId } = await params;
  const snapshot = await loadExceptionWorkbench(ctx, exceptionId);
  if (!snapshot) notFound();

  return <OpsExceptionDetail snapshot={snapshot} />;
}

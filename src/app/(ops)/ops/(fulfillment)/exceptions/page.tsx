import type { Metadata } from "next";
import { OpsExceptionsWorkbench } from "@/components/ops/ops-exceptions-workbench";
import type { ExceptionQueueFilter } from "@/lib/exceptions";
import { demoModeEnabled } from "@/lib/demo-mode";
import { requireAuthWithRole } from "@/server/auth/request";
import { ensureOpsDemoClock } from "@/server/ops/demo-clock";
import { loadExceptionsQueue } from "@/server/ops/exception-queries";

export const metadata: Metadata = { title: "Exceptions — Rolling GA Ops" };
export const dynamic = "force-dynamic";

function parseFilter(raw: string | undefined): ExceptionQueueFilter {
  if (
    raw === "in_progress" ||
    raw === "past_promise" ||
    raw === "at_risk" ||
    raw === "resolved" ||
    raw === "all"
  ) {
    return raw;
  }
  return "open";
}

export default async function OpsExceptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; event?: string }>;
}) {
  const ctx = await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops/exceptions");
  if (demoModeEnabled()) {
    await ensureOpsDemoClock();
  }

  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const eventId = params.event ?? undefined;
  const snapshot = await loadExceptionsQueue(ctx, filter, eventId);

  return <OpsExceptionsWorkbench snapshot={snapshot} filter={filter} eventId={eventId} />;
}

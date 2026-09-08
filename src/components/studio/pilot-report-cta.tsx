import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pilotReportHref } from "@/lib/pilot-report/goals";

export function PilotReportCta({
  eventId,
  prominent = false,
}: {
  eventId: string;
  prominent?: boolean;
}) {
  const href = pilotReportHref(eventId);

  if (prominent) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-violet-500"
      >
        View pilot report
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-200 hover:bg-violet-500/20"
    >
      Pilot report
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ShowEconomicsCta({
  eventId,
  prominent = false,
}: {
  eventId: string;
  prominent?: boolean;
}) {
  const href = `/studio/insights/economics/${eventId}`;

  if (prominent) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-violet-400"
      >
        View show economics
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20"
    >
      Show economics
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}

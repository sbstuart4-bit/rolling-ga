import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fulfillmentHref } from "@/lib/fulfillment";

export function FulfillmentCta({
  eventId,
  prominent = false,
}: {
  eventId: string;
  prominent?: boolean;
}) {
  const href = fulfillmentHref(eventId);

  if (prominent) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/10"
      >
        View fulfillment
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-200 hover:bg-sky-500/20"
    >
      View fulfillment
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}

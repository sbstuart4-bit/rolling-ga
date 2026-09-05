import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEventDate } from "@/lib/format";
import type { EventRow } from "@/server/events/queries";
import type { EventReadiness } from "@/server/studio/tour-queries";
import { cn } from "@/lib/utils";

const STATE_LABEL: Record<string, string> = {
  upcoming: "Upcoming",
  live: "Live",
  recently_ended: "Post-show",
  archived: "Archived",
};

export function TourEventList({
  tourId,
  events,
  readiness,
}: {
  tourId: string;
  events: EventRow[];
  readiness: EventReadiness[];
}) {
  const readinessById = new Map(readiness.map((row) => [row.eventId, row]));

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card/40">
      {events.map((event) => {
        const status = readinessById.get(event.id);
        return (
          <li key={event.id} className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="font-semibold tracking-wide uppercase">
                  {event.venueCity}
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="tabular">{formatEventDate(event.startsAt, event.timezone).toUpperCase()}</span>
                </p>
                <p className="text-sm text-muted-foreground">{event.venueName}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge label={STATE_LABEL[status?.lifecycleState ?? "upcoming"] ?? "Scheduled"} live={status?.lifecycleState === "live"} />
                  <Badge label={status?.takeoverConfigured ? "Takeover ✓" : "Takeover —"} ok={status?.takeoverConfigured} />
                  <Badge label={status?.merchConfigured ? `Merch ✓ (${status.merchProductCount})` : "Merch —"} ok={status?.merchConfigured} />
                  <Badge label={status?.scheduledDropCount ? `Drops ${status.scheduledDropCount}` : "No drops"} ok={(status?.scheduledDropCount ?? 0) > 0} />
                  <Badge label={status?.verificationConfigured ? "Verify ✓" : "Verify —"} ok={status?.verificationConfigured} />
                  <Badge
                    label={`Post-show ${status?.postShowMinutes ?? 0}m (${status?.postShowSource ?? "tour"})`}
                    ok={status?.postShowConfigured}
                  />
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/studio/tour/${tourId}/events/${event.id}`}>
                  <Pencil className="size-3.5" aria-hidden />
                  Edit show
                </Link>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Badge({ label, ok = false, live = false }: { label: string; ok?: boolean; live?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        live
          ? "border-[color:var(--studio-live,#e879f9)]/40 bg-[color:var(--studio-live,#e879f9)]/10 text-[color:var(--studio-live,#e879f9)]"
          : ok
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-border bg-muted/30 text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

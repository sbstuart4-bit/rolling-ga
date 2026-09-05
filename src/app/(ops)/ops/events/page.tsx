import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, QrCode, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { listLiveEvents, listUpcomingEvents, countVerifiedAttendance } from "@/server/events/queries";
import { formatEventDate, formatEventTime } from "@/lib/format";

export const metadata: Metadata = { title: "Events — Fulfillment" };

export default async function OpsEventsPage() {
  await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops/events");

  const [liveEvents, upcomingEvents] = await Promise.all([
    listLiveEvents(),
    listUpcomingEvents(20),
  ]);

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Tonight&rsquo;s events</h1>

      {liveEvents.length === 0 && (
        <p className="text-muted-foreground">No shows currently live.</p>
      )}

      {liveEvents.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow text-muted-foreground">Live now</h2>
          <ul className="space-y-3">
            {liveEvents.map(async (event) => {
              const verified = await countVerifiedAttendance(event.id);
              return (
                <li key={event.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
                  <div className="flex size-2 shrink-0 rounded-full bg-success" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{event.artistName}</p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3 shrink-0" aria-hidden />
                      {event.venueCity} · {event.venueName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="size-4 text-muted-foreground" aria-hidden />
                    <span className="tabular font-medium">{verified.toLocaleString("en-US")} verified</span>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/ops/orders?event=${event.id}`}>Orders</Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {upcomingEvents.length > 0 && (
        <section className="space-y-3">
          <h2 className="eyebrow text-muted-foreground">Upcoming</h2>
          <ul className="space-y-2 text-sm">
            {upcomingEvents.slice(0, 10).map((event) => (
              <li key={event.id} className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{event.artistName} · {event.venueCity}</p>
                  <p className="text-muted-foreground">{formatEventDate(event.startsAt, event.timezone)}</p>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/ops/orders?event=${event.id}`}>Orders</Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

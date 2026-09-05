"use client";

import { useRouter } from "next/navigation";
import { formatEventDateShort } from "@/lib/format";

export function ShowCohortPicker({
  events,
  currentEventId,
}: {
  events: { id: string; venueCity: string; startsAt: Date; timezone: string }[];
  currentEventId: string;
}) {
  const router = useRouter();

  return (
    <select
      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
      value={currentEventId}
      onChange={(e) => router.push(`/studio/fans/cohort/${e.target.value}`)}
      aria-label="Select show cohort"
    >
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.venueCity} · {formatEventDateShort(event.startsAt, event.timezone)}
        </option>
      ))}
    </select>
  );
}

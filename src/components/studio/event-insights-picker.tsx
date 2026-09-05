"use client";

import { formatEventDate } from "@/lib/format";

export function EventInsightsPicker({
  events,
  currentEventId,
}: {
  events: { id: string; venueCity: string; startsAt: Date; timezone: string }[];
  currentEventId: string;
}) {
  return (
    <select
      defaultValue={currentEventId}
      className="h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white"
      onChange={(e) => {
        window.location.href = `/studio/insights?event=${e.target.value}`;
      }}
    >
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.venueCity} · {formatEventDate(event.startsAt, event.timezone)}
        </option>
      ))}
    </select>
  );
}

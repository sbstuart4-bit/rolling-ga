"use client";

import { formatEventDate } from "@/lib/format";

export function EventFulfillmentPicker({
  events,
  currentEventId,
}: {
  events: { id: string; venueCity: string; startsAt: Date; timezone: string }[];
  currentEventId: string;
}) {
  return (
    <select
      defaultValue={currentEventId}
      className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
      onChange={(e) => {
        const params = new URLSearchParams(window.location.search);
        params.set("event", e.target.value);
        window.location.href = `/studio/orders?${params.toString()}`;
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

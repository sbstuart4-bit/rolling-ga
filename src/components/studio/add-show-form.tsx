"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEventAction, type TourActionState } from "@/server/studio/tour-actions";

export function AddShowForm({
  artistId,
  tourId,
  venues,
}: {
  artistId: string;
  tourId: string;
  venues: { id: string; name: string; city: string }[];
}) {
  const [state, action, pending] = useActionState<TourActionState, FormData>(
    createEventAction,
    {},
  );

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-border bg-card/40 p-6">
      <input type="hidden" name="artistId" value={artistId} />
      <input type="hidden" name="tourId" value={tourId} />

      <div className="space-y-1.5">
        <Label htmlFor="venueId">Venue</Label>
        <select
          id="venueId"
          name="venueId"
          required
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select venue</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.city} — {venue.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startsAt">Show start</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endsAt">Show end</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" required className="h-11" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Show title (optional)</Label>
        <Input id="title" name="title" placeholder="Night 12 — Detroit" className="h-11" />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Add show"}
      </Button>
    </form>
  );
}

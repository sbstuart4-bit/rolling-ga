"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { InheritanceBadge } from "@/components/studio/inheritance-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fieldHasOverride, themeLevelToSource } from "@/lib/tour-inheritance";
import type { ResolvedTheme } from "@/lib/theme";
import {
  duplicateEventConfigAction,
  resetEventToTourDefaultsAction,
  updateEventOverrideAction,
  type TourActionState,
} from "@/server/studio/tour-actions";

export function ShowConfigEditor({
  artistId,
  tourId,
  eventId,
  event,
  override,
  resolvedTheme,
  otherEvents,
}: {
  artistId: string;
  tourId: string;
  eventId: string;
  event: {
    localMessage: string | null;
    postShowWindowMinutes: number | null;
    venueCity: string;
  };
  override: {
    cityArtworkUrl: string | null;
    heroImageUrl: string | null;
    showMessaging: string | null;
    accent: string | null;
  } | null;
  resolvedTheme: ResolvedTheme;
  otherEvents: { id: string; venueCity: string }[];
}) {
  const [state, action, pending] = useActionState<TourActionState, FormData>(
    updateEventOverrideAction,
    {},
  );
  const [dupState, dupAction, dupPending] = useActionState<TourActionState, FormData>(
    duplicateEventConfigAction,
    {},
  );
  const [targetEventId, setTargetEventId] = React.useState(otherEvents[0]?.id ?? "");

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-5 rounded-2xl border border-border bg-card/40 p-6">
        <input type="hidden" name="tourId" value={tourId} />
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="artistId" value={artistId} />

        <header className="space-y-1">
          <h2 className="text-lg font-semibold">Show override — {event.venueCity}</h2>
          <p className="text-sm text-muted-foreground">
            Only fields you set here override tour defaults. Everything else inherits from the tour
            and artist brand cascade.
          </p>
        </header>

        <OverrideField
          label={`${event.venueCity} show message`}
          name="localMessage"
          defaultValue={event.localMessage ?? ""}
          source={fieldHasOverride(event.localMessage) ? "show-override" : "inherited-tour"}
        />

        <OverrideField
          label="City hero artwork URL"
          name="cityArtworkUrl"
          defaultValue={override?.cityArtworkUrl ?? ""}
          source={
            fieldHasOverride(override?.cityArtworkUrl)
              ? "show-override"
              : themeLevelToSource(resolvedTheme.provenance.background)
          }
        />

        <OverrideField
          label="Hero image URL"
          name="heroImageUrl"
          defaultValue={override?.heroImageUrl ?? ""}
          source={
            fieldHasOverride(override?.heroImageUrl)
              ? "show-override"
              : themeLevelToSource(resolvedTheme.provenance.background)
          }
        />

        <OverrideField
          label="Show messaging"
          name="showMessaging"
          defaultValue={override?.showMessaging ?? ""}
          source={
            fieldHasOverride(override?.showMessaging)
              ? "show-override"
              : themeLevelToSource(resolvedTheme.provenance.accent)
          }
        />

        <OverrideField
          label="Accent color"
          name="accent"
          defaultValue={override?.accent ?? ""}
          source={themeLevelToSource(resolvedTheme.provenance.accent)}
        />

        <OverrideField
          label="Post-show window (minutes, blank = inherit tour)"
          name="postShowWindowMinutes"
          defaultValue={event.postShowWindowMinutes?.toString() ?? ""}
          source={event.postShowWindowMinutes != null ? "show-override" : "inherited-tour"}
        />

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state.ok && <p className="text-sm text-emerald-400">Show configuration saved.</p>}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Save show override"}
          </Button>
          <Button
            type="submit"
            variant="outline"
            formAction={resetEventToTourDefaultsAction}
            disabled={pending}
          >
            Reset to tour default
          </Button>
        </div>
      </form>

      {otherEvents.length > 0 && (
        <form action={dupAction} className="rounded-2xl border border-border bg-card/40 p-6 space-y-4">
          <input type="hidden" name="artistId" value={artistId} />
          <input type="hidden" name="tourId" value={tourId} />
          <input type="hidden" name="sourceEventId" value={eventId} />
          <div>
            <h3 className="font-semibold">Duplicate configuration</h3>
            <p className="text-sm text-muted-foreground">
              Copy this show&apos;s theme and messaging to another city. Orders, attendance, and
              credentials are never copied.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="targetEventId">Target show</Label>
              <select
                id="targetEventId"
                name="targetEventId"
                value={targetEventId}
                onChange={(e) => setTargetEventId(e.target.value)}
                className="h-11 rounded-md border border-input bg-background px-3 text-sm"
              >
                {otherEvents.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.venueCity}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="outline" disabled={dupPending || !targetEventId}>
              {dupPending ? <Loader2 className="size-4 animate-spin" /> : "Duplicate to target show"}
            </Button>
          </div>
          {dupState.error && <p className="text-sm text-destructive">{dupState.error}</p>}
          {dupState.ok && <p className="text-sm text-emerald-400">Configuration duplicated.</p>}
        </form>
      )}
    </div>
  );
}

function OverrideField({
  label,
  name,
  defaultValue,
  source,
}: {
  label: string;
  name: string;
  defaultValue: string;
  source: ReturnType<typeof themeLevelToSource> | "show-override" | "inherited-tour";
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={name}>{label}</Label>
        <InheritanceBadge source={source} />
      </div>
      <Input id={name} name={name} defaultValue={defaultValue} className="h-11" />
    </div>
  );
}

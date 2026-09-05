"use client";

import * as React from "react";
import { useActionState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dismissStayConnectedAction,
  optInStayConnectedAction,
  type ConsentActionState,
} from "@/server/consent/actions";
import type { StayConnectedState } from "@/lib/types";

/**
 * Inline, non-blocking prompt for artist-specific marketing consent.
 */
export function StayConnectedCard({
  artistId,
  artistName,
  eventSlug,
  initialState,
}: {
  artistId: string;
  artistName: string;
  eventSlug?: string;
  initialState: StayConnectedState;
}) {
  const [visibleState, setVisibleState] = React.useState(initialState);
  const [optInState, optInAction, optInPending] = useActionState<ConsentActionState, FormData>(
    optInStayConnectedAction,
    {},
  );
  const [dismissState, dismissAction, dismissPending] = useActionState<ConsentActionState, FormData>(
    dismissStayConnectedAction,
    {},
  );

  React.useEffect(() => {
    if (optInState.ok) setVisibleState("connected");
  }, [optInState.ok]);

  React.useEffect(() => {
    if (dismissState.ok) setVisibleState("dismissed");
  }, [dismissState.ok]);

  if (visibleState === "dismissed") return null;

  if (visibleState === "connected") {
    return (
      <section
        role="status"
        className="rounded-2xl border border-artist-border bg-artist-surface px-5 py-4 text-center"
      >
        <p className="inline-flex items-center gap-2 text-sm font-medium text-artist-accent">
          <BadgeCheck className="size-4" aria-hidden />
          Connected
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-artist-border bg-artist-surface p-5">
      <div className="space-y-1 text-center">
        <p className="eyebrow text-artist-muted">Stay connected with {artistName.toUpperCase()}?</p>
        <p className="text-sm text-artist-muted text-balance">
          Get future drops, attendee exclusives and show announcements from {artistName}.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <form action={optInAction} className="flex-1">
          <input type="hidden" name="artistId" value={artistId} />
          {eventSlug ? <input type="hidden" name="eventSlug" value={eventSlug} /> : null}
          <Button
            type="submit"
            disabled={optInPending || dismissPending}
            className="h-11 w-full bg-artist-accent font-semibold text-artist-accent-fg hover:bg-artist-accent/90"
          >
            {optInPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Yes, keep me connected"}
          </Button>
        </form>

        <form action={dismissAction} className="flex-1">
          <input type="hidden" name="artistId" value={artistId} />
          {eventSlug ? <input type="hidden" name="eventSlug" value={eventSlug} /> : null}
          <Button
            type="submit"
            variant="outline"
            disabled={optInPending || dismissPending}
            className="h-11 w-full border-artist-border bg-transparent text-artist-fg hover:bg-artist-accent/10"
          >
            Not now
          </Button>
        </form>
      </div>

      {(optInState.error || dismissState.error) && (
        <p role="alert" className="mt-3 text-center text-sm text-destructive">
          {optInState.error ?? dismissState.error}
        </p>
      )}
    </section>
  );
}

"use client";

import * as React from "react";
import { markFanShowContextAction } from "@/server/fans/show-context-actions";

/** Persists the active show slug so tab navigation stays artist-scoped. */
export function FanShowContextMarker({ eventSlug }: { eventSlug: string }) {
  React.useEffect(() => {
    void markFanShowContextAction(eventSlug);
  }, [eventSlug]);

  return null;
}

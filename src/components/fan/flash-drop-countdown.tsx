"use client";

import * as React from "react";
import { formatCountdown } from "@/lib/format";

/**
 * Flash drop countdown.
 *
 * The server clock offset is measured once on mount against `/api/time` so a device
 * with a fast clock cannot extend a flash drop past its authoritative close, and a
 * slow device does not see it end early. The countdown then ticks purely client-side,
 * which avoids 60 server requests per minute.
 */
export function FlashDropCountdown({ endsAt }: { endsAt: string }) {
  const [msLeft, setMsLeft] = React.useState<number | null>(null);
  const serverOffsetRef = React.useRef(0);
  const endMs = new Date(endsAt).getTime();

  React.useEffect(() => {
    // Measure server-client clock offset
    const localBefore = Date.now();
    fetch("/api/time")
      .then((r) => r.json())
      .then(({ now: serverNow }: { now: number }) => {
        const localAfter = Date.now();
        const latencyMs = (localAfter - localBefore) / 2;
        serverOffsetRef.current = serverNow + latencyMs - localAfter;
      })
      .catch(() => {
        // Network error; offset stays 0 (uses local clock)
      });

    const tick = () => {
      const correctedNow = Date.now() + serverOffsetRef.current;
      setMsLeft(Math.max(0, endMs - correctedNow));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endMs]);

  if (msLeft === null) return null;
  if (msLeft <= 0) return <span>Drop ended</span>;

  return <span>{formatCountdown(msLeft)} left</span>;
}

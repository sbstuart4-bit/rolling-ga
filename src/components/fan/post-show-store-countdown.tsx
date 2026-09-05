"use client";

import * as React from "react";
import { formatCountdown } from "@/lib/format";

/**
 * Countdown until the attendee-exclusive post-show store closes.
 * Uses the same server clock sync as flash drops.
 */
export function PostShowStoreCountdown({ closesAt }: { closesAt: string }) {
  const [msLeft, setMsLeft] = React.useState<number | null>(null);
  const serverOffsetRef = React.useRef(0);
  const endMs = new Date(closesAt).getTime();

  React.useEffect(() => {
    const localBefore = Date.now();
    fetch("/api/time")
      .then((r) => r.json())
      .then(({ now: serverNow }: { now: number }) => {
        const localAfter = Date.now();
        const latencyMs = (localAfter - localBefore) / 2;
        serverOffsetRef.current = serverNow + latencyMs - localAfter;
      })
      .catch(() => {});

    const tick = () => {
      const correctedNow = Date.now() + serverOffsetRef.current;
      setMsLeft(Math.max(0, endMs - correctedNow));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endMs]);

  if (msLeft === null) return null;
  if (msLeft <= 0) return <span className="font-mono tabular">00:00:00</span>;

  return <span className="font-mono tabular">{formatCountdown(msLeft)}</span>;
}

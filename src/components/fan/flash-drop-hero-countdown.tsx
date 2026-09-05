"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function splitCountdown(msRemaining: number) {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { hours, minutes, seconds, expired: total <= 0 };
}

/**
 * Large flash-drop countdown for the live landing moment.
 * Syncs against `/api/time` once, then ticks client-side.
 */
export function FlashDropHeroCountdown({
  endsAt,
  className,
}: {
  endsAt: string;
  className?: string;
}) {
  const [parts, setParts] = React.useState<ReturnType<typeof splitCountdown> | null>(null);
  const serverOffsetRef = React.useRef(0);
  const endMs = new Date(endsAt).getTime();

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
      setParts(splitCountdown(endMs - correctedNow));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endMs]);

  if (!parts) return null;

  if (parts.expired) {
    return <p className={cn("font-artist text-2xl text-artist-muted", className)}>Drop ended</p>;
  }

  const segments = [
    { value: pad(parts.hours), label: "HRS" },
    { value: pad(parts.minutes), label: "MINS" },
    { value: pad(parts.seconds), label: "SECS" },
  ];

  return (
    <div className={cn("flex items-end justify-center gap-2", className)}>
      {segments.map((segment, index) => (
        <React.Fragment key={segment.label}>
          {index > 0 && (
            <span className="mb-3 font-artist text-3xl font-light text-artist-muted/40">:</span>
          )}
          <div className="text-center">
            <p className="font-artist text-5xl leading-none tracking-wide text-artist-fg md:text-6xl">
              {segment.value}
            </p>
            <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-artist-muted">
              {segment.label}
            </p>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

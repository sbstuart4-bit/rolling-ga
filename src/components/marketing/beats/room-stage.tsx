"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BareWall, PosterWall, StageLight } from "./room-artifacts";
import { ROOM_PLATES, type RoomPlateId } from "./room-plates";
import { cn } from "@/lib/utils";

/**
 * Beat 1's stage: you arrive inside the show, it peaks, and then the room drains
 * until only fragments are left.
 *
 * The scroll produces one number and everything else is derived from it, which
 * keeps the beat to a handful of opacities instead of a timeline of competing
 * animations. Colour drains because the coloured sheets fade out and the bare
 * wall fades in — no per-frame filters.
 *
 * Static by default. The tall track and the crossfade switch on after mount and
 * never when reduced motion is requested, so without JavaScript this is one
 * legible frame containing the whole beat.
 */

const FRAGMENTS = ["Ticketing has the sale.", "The venue has the count.", "Merch has a receipt."];

const TURN = "None of it adds up to a relationship with the person who was actually in the room.";

function ramp(p: number, from: number, to: number): number {
  if (p <= from) return 0;
  if (p >= to) return 1;
  return (p - from) / (to - from);
}

/** A photograph once one exists; the artifact wall until then. */
function Plate({
  id,
  style,
  priority = false,
}: {
  id: RoomPlateId;
  style?: React.CSSProperties;
  priority?: boolean;
}) {
  const plate = ROOM_PLATES[id];

  if (plate.src) {
    return (
      <div aria-hidden className="mk-print absolute inset-0 overflow-hidden" style={style}>
        <Image
          src={plate.src}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: plate.objectPosition }}
        />
        <div className="mk-flash absolute inset-0" />
      </div>
    );
  }

  return id === "afterLoadOut" ? <BareWall style={style} /> : <PosterWall style={style} />;
}

function Overline({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-4 gap-y-2", className)}>
      <span className="mk-kicker text-world-muted">Rolling GA</span>
      <span aria-hidden className="h-px w-8 bg-world-rule sm:w-14" />
      <span className="mk-kicker text-world-accent">The Degens &middot; Detroit</span>
    </div>
  );
}

/** A narrow column under the headline: each system holds a piece, none holds the person. */
function Fragments({ reveal }: { reveal?: (i: number) => number }) {
  return (
    <div className="flex md:justify-end">
      <div className="w-full max-w-md space-y-4">
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-3 md:grid-cols-1">
          {FRAGMENTS.map((line, i) => (
            <li
              key={line}
              className="mk-body border-t border-world-rule pt-2.5 text-[0.8125rem] text-world-muted sm:text-sm"
              style={reveal ? { opacity: reveal(i) } : undefined}
            >
              {line}
            </li>
          ))}
        </ul>
        <p
          className="mk-body text-[0.9375rem] leading-snug text-world-fg"
          style={reveal ? { opacity: reveal(3) } : undefined}
        >
          {TURN}
        </p>
      </div>
    </div>
  );
}

/**
 * Both halves of the turn, broken to exactly two lines each so they occupy
 * identical geometry. Without that the crossfade lands "they're a room" on top
 * of "fragments" and the most important moment on the page becomes unreadable.
 */
function Headline({ a, b }: { a: number; b: number }) {
  return (
    <h1 className="mk-display mk-display-tight grid w-full min-w-0 max-w-full text-[clamp(2rem,9vw,11rem)]">
      <span className="col-start-1 row-start-1" style={{ opacity: a }}>
        Tonight,
        <br />
        they&rsquo;re a room.
      </span>
      <span
        className="col-start-1 row-start-1 text-world-muted"
        style={{ opacity: b }}
      >
        Tomorrow,
        <br />
        they&rsquo;re fragments.
      </span>
    </h1>
  );
}

export function RoomStage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);
  const [p, setP] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // The sticky crossfade needs horizontal room the phone does not have. Below
    // md the static frame is the intentional mobile composition — same copy,
    // poster band above and type below, no clipped headlines.
    if (window.matchMedia("(max-width: 767px)").matches) return;
    setAnimated(true);

    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      setP(travel <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / travel)));
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const hasShowEnergyPhoto = ROOM_PLATES.showEnergy.src !== null;

  if (!animated) {
    return (
      <div className="relative isolate overflow-hidden">
        {/* Without the crossfade the wall becomes a band the copy sits below, */}
        {/* rather than a backdrop the copy has to fight. */}
        <div className="relative h-[38svh] min-h-64 md:h-[46svh]">
          <Plate id="packedRoom" priority />
          <StageLight style={{ opacity: 0.35 }} />
        </div>
        <div className="relative mx-auto flex w-full max-w-[100rem] flex-col gap-8 px-5 pb-20 pt-10 sm:px-8 md:gap-12 md:pb-28">
          <Overline />
          <h1 className="mk-display mk-display-tight text-[clamp(2.25rem,10.5vw,11rem)]">
            Tonight,
            <br />
            they&rsquo;re a room.
            <span className="mt-3 block text-world-muted">
              Tomorrow,
              <br />
              they&rsquo;re fragments.
            </span>
          </h1>
          <Fragments />
        </div>
      </div>
    );
  }

  const arrival = 1 - ramp(p, 0.3, 0.52);
  const peak = ramp(p, 0.1, 0.28) * (1 - ramp(p, 0.32, 0.56));
  const aftermath = ramp(p, 0.4, 0.74);

  return (
    <div ref={trackRef} className="relative h-[210vh] overflow-x-clip md:h-[280vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end overflow-hidden">
        <Plate id="packedRoom" priority style={{ opacity: arrival }} />
        {hasShowEnergyPhoto ? (
          <Plate id="showEnergy" style={{ opacity: peak }} />
        ) : (
          <StageLight style={{ opacity: peak }} />
        )}
        <Plate id="afterLoadOut" style={{ opacity: aftermath }} />

        <div className="relative mx-auto flex w-full min-w-0 max-w-[100rem] flex-col gap-8 px-5 pb-14 pt-24 sm:px-8 md:gap-12 md:pb-20">
          <div style={{ opacity: 1 - ramp(p, 0.62, 0.82) * 0.55 }}>
            <Overline />
          </div>
          <Headline a={1 - ramp(p, 0.26, 0.4)} b={ramp(p, 0.44, 0.58)} />
          <Fragments reveal={(i) => ramp(p, 0.58 + i * 0.055, 0.67 + i * 0.055)} />
        </div>
      </div>
    </div>
  );
}

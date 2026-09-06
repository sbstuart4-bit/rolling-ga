"use client";

import * as React from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  formatDemoClockDate,
  formatDemoClockPosition,
  formatDemoClockTime,
  isDemoShowNight,
} from "@/lib/demo-calendar";
import {
  jumpToNovaNashvilleDoorsOpenAction,
  jumpToNovaNashvilleLiveAction,
  jumpToNovaNashvillePostShowAction,
  resetDemoClockAction,
  resetDemoDataAction,
  setDemoClockAction,
} from "@/server/demo/clock-actions";

export function DemoClockControls({
  now,
  anchor,
  showDate,
  days,
  hours,
  maxDays,
  maxHours,
}: {
  now: string;
  anchor: string;
  showDate: string;
  days: number;
  hours: number;
  maxDays: number;
  maxHours: number;
}) {
  const [dayValue, setDayValue] = React.useState(days);
  const [hourValue, setHourValue] = React.useState(hours);
  const [pending, startTransition] = React.useTransition();

  // The sliders are dragged locally but the clock is owned by the server, so they snap
  // back to whatever the server reports once an action revalidates the page.
  const [serverPosition, setServerPosition] = React.useState({ days, hours });
  if (serverPosition.days !== days || serverPosition.hours !== hours) {
    setServerPosition({ days, hours });
    setDayValue(days);
    setHourValue(hours);
  }

  function commit(nextDays: number, nextHours: number) {
    startTransition(async () => {
      await setDemoClockAction(nextDays, nextHours);
    });
  }

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="eyebrow text-muted-foreground">Demo clock</p>
          <p className="text-2xl font-semibold tracking-normal tabular">{now}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Resets to {anchor} · Nova Kestrel plays Nashville {showDate}
          </p>
        </div>
        <p className="text-sm font-medium leading-snug text-primary">
          {formatDemoClockPosition(dayValue, hourValue)}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Date</span>
          <span>
            {formatDemoClockDate(dayValue, hourValue)} / {formatDemoClockDate(maxDays, 0)}
            {isDemoShowNight(dayValue, hourValue) ? " · show night" : ""}
          </span>
        </div>
        <Slider
          min={0}
          max={maxDays}
          step={1}
          value={[dayValue]}
          disabled={pending}
          onValueChange={(v) => setDayValue(v[0] ?? 0)}
          onValueCommit={(v) => commit(v[0] ?? 0, hourValue)}
          aria-label="Demo date"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Time</span>
          <span>{formatDemoClockTime(hourValue)}</span>
        </div>
        <Slider
          min={0}
          max={maxHours}
          step={1}
          value={[hourValue]}
          disabled={pending}
          onValueChange={(v) => setHourValue(v[0] ?? 0)}
          onValueCommit={(v) => commit(dayValue, v[0] ?? 0)}
          aria-label="Demo time"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Nashville presets</p>
        <div className="flex flex-wrap gap-2">
          <form action={jumpToNovaNashvilleDoorsOpenAction}>
            <Button type="submit" variant="secondary" size="sm" disabled={pending}>
              Doors open
            </Button>
          </form>
          <form action={jumpToNovaNashvilleLiveAction}>
            <Button type="submit" variant="secondary" size="sm" disabled={pending}>
              Live
            </Button>
          </form>
          <form action={jumpToNovaNashvillePostShowAction}>
            <Button type="submit" variant="secondary" size="sm" disabled={pending}>
              Post-show
            </Button>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <form action={resetDemoClockAction}>
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            <RotateCcw className="size-3.5" aria-hidden />
            Reset clock
          </Button>
        </form>

        <form
          action={resetDemoDataAction}
          onSubmit={(e) => {
            if (
              !window.confirm(
                "Reset all demo data? This wipes orders, credentials, and attendance — then re-seeds from June 1.",
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            disabled={pending}
          >
            <Trash2 className="size-3.5" aria-hidden />
            Reset demo data
          </Button>
        </form>
      </div>
    </section>
  );
}

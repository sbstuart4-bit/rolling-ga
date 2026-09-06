import "server-only";

import { cookies } from "next/headers";
import { DEMO_CLOCK_COOKIE } from "@/lib/auth-cookies";
import { demoModeEnabled } from "@/lib/demo-mode";
import {
  DAY_MS,
  DEMO_CLOCK_MAX_DAYS,
  DEMO_CLOCK_MAX_HOURS,
  DEMO_CLOCK_MIN_OFFSET_MS,
  DEMO_CLOCK_RANGE_MS,
  demoAnchorDate,
  demoClockOffsetForDate,
  demoShowDate,
  daysAndHoursToOffset,
  HOUR_MS,
  offsetToDaysAndHours,
} from "@/lib/demo-calendar";

export { DAY_MS, HOUR_MS, DEMO_CLOCK_RANGE_MS };

/**
 * Offset forward from the June 1 demo anchor. Resetting the clock returns here — never
 * to real wall time — so every demo walkthrough starts at the same place on the calendar.
 */
const globalForClock = globalThis as unknown as { __rollingGaDemoClockOffsetMs?: number };

function readOffsetMs(): number {
  return globalForClock.__rollingGaDemoClockOffsetMs ?? 0;
}

/** Ignored outside demo mode, so no caller can shift business time in production. */
function writeOffsetMs(ms: number): void {
  if (!demoModeEnabled()) return;
  globalForClock.__rollingGaDemoClockOffsetMs = Math.max(
    DEMO_CLOCK_MIN_OFFSET_MS,
    Math.min(ms, DEMO_CLOCK_RANGE_MS),
  );
}

/**
 * Authoritative "now" for every countdown, event state, and verification window.
 *
 * Outside demo mode this is real server time. The simulated calendar only ever applies
 * when demo mode is on, so a production deployment can never be pinned to the seeded
 * demo anchor.
 */
export function demoNow(): Date {
  if (!demoModeEnabled()) return new Date();
  return new Date(demoAnchorDate().getTime() + readOffsetMs());
}

export interface DemoClockState {
  now: Date;
  anchor: Date;
  offsetMs: number;
  days: number;
  hours: number;
  rangeMs: number;
  maxDays: number;
  maxHours: number;
  showDate: Date;
}

export function getDemoClockState(): DemoClockState {
  const offsetMs = readOffsetMs();
  const { days, hours } = offsetToDaysAndHours(offsetMs);
  const anchor = demoAnchorDate();

  return {
    now: new Date(anchor.getTime() + offsetMs),
    anchor,
    offsetMs,
    days,
    hours,
    rangeMs: DEMO_CLOCK_RANGE_MS,
    maxDays: DEMO_CLOCK_MAX_DAYS,
    maxHours: DEMO_CLOCK_MAX_HOURS,
    showDate: demoShowDate(),
  };
}

export function advanceDemoClock(deltaMs: number): void {
  writeOffsetMs(readOffsetMs() + deltaMs);
}

export function setDemoClockOffset(offsetMs: number): void {
  writeOffsetMs(offsetMs);
}

export function setDemoClockDaysAndHours(days: number, hours: number): void {
  writeOffsetMs(daysAndHoursToOffset(days, hours));
}

export function setDemoClockToDate(date: Date): void {
  writeOffsetMs(demoClockOffsetForDate(date));
}

export function resetDemoClock(): void {
  writeOffsetMs(0);
}

export async function persistDemoClockOffset(): Promise<void> {
  if (!demoModeEnabled()) return;
  try {
    const jar = await cookies();
    jar.set(DEMO_CLOCK_COOKIE, String(readOffsetMs()), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  } catch {
    // cookies() unavailable outside a request
  }
}

export async function hydrateDemoClockFromCookie(): Promise<void> {
  if (!demoModeEnabled()) return;
  try {
    const jar = await cookies();
    const raw = jar.get(DEMO_CLOCK_COOKIE)?.value;
    if (!raw) return;
    const offset = Number.parseInt(raw, 10);
    if (Number.isFinite(offset)) writeOffsetMs(offset);
  } catch {
    // cookies() unavailable outside a request
  }
}

export async function clearDemoClockCookie(): Promise<void> {
  if (!demoModeEnabled()) return;
  try {
    const jar = await cookies();
    jar.delete(DEMO_CLOCK_COOKIE);
  } catch {
    // ignore
  }
}

/**
 * Demo clock production safety.
 *
 * The simulated calendar drives event state, verification windows and drop windows, so
 * it must apply only in demo mode — and nothing outside demo mode may move it.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  demoAnchorDate,
  DAY_MS,
  HOUR_MS,
  demoDetroitDoorsOpen,
  demoDetroitLive,
  formatDemoClockDate,
  formatDemoClockPosition,
  isDemoShowNight,
  demoDetroitEventSlug,
} from "@/lib/demo-calendar";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  demoNow,
  getDemoClockState,
  resetDemoClock,
  setDemoClockDaysAndHours,
} from "@/server/demo/clock";
import {
  advanceDemoClockByDayAction,
  advanceDemoClockByHourAction,
  resetDemoClockAction,
  setDemoClockAction,
} from "@/server/demo/clock-actions";

afterEach(() => {
  vi.unstubAllEnvs();
  resetDemoClock();
});

describe("demoNow", () => {
  it("returns real server time when demo mode is off", () => {
    setDemoClockDaysAndHours(10, 0);
    vi.stubEnv("NODE_ENV", "production");

    const now = demoNow();

    expect(Math.abs(now.getTime() - Date.now())).toBeLessThan(1000);
    expect(now.getTime()).not.toBe(demoAnchorDate().getTime() + 10 * DAY_MS);
  });

  it("returns the simulated calendar when demo mode is on", () => {
    setDemoClockDaysAndHours(3, 5);

    expect(demoNow().getTime()).toBe(demoAnchorDate().getTime() + 3 * DAY_MS + 5 * HOUR_MS);
  });

  it("starts from the June 1 anchor after a reset", () => {
    setDemoClockDaysAndHours(12, 6);
    resetDemoClock();

    expect(demoNow().getTime()).toBe(demoAnchorDate().getTime());
  });
});

describe("demo clock mutations", () => {
  it("advances the clock while demo mode is on", async () => {
    await advanceDemoClockByDayAction();
    await advanceDemoClockByHourAction();

    expect(getDemoClockState().offsetMs).toBe(DAY_MS + HOUR_MS);
  });

  it("sets an exact day and hour while demo mode is on", async () => {
    await setDemoClockAction(29, 11);

    expect(getDemoClockState()).toMatchObject({ days: 29, hours: 11 });
  });

  it("does nothing when demo mode is off", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await advanceDemoClockByDayAction();
    await advanceDemoClockByHourAction();
    await setDemoClockAction(45, 12);

    expect(getDemoClockState().offsetMs).toBe(0);
  });

  it("cannot be reset away from a demo operator's position when demo mode is off", async () => {
    setDemoClockDaysAndHours(7, 0);
    vi.stubEnv("NODE_ENV", "production");

    await resetDemoClockAction();

    vi.unstubAllEnvs();
    expect(getDemoClockState().offsetMs).toBe(7 * DAY_MS);
  });
});

describe("Detroit clock presets", () => {
  it("maps doors open to day 29 hour 8", () => {
    expect(demoDetroitDoorsOpen()).toEqual({ days: 29, hours: 8 });
  });

  it("maps live set to day 29 hour 11", () => {
    expect(demoDetroitLive()).toEqual({ days: 29, hours: 11 });
  });

  it("sets the clock to Detroit live via preset action", async () => {
    await setDemoClockAction(0, 0);
    const { jumpToDetroitLiveAction } = await import("@/server/demo/clock-actions");
    await jumpToDetroitLiveAction();

    expect(getDemoClockState()).toMatchObject({ days: 29, hours: 11 });
    expect(demoNow().getTime()).toBe(demoAnchorDate().getTime() + 29 * DAY_MS + 11 * HOUR_MS);
  });
});

describe("demo clock labels", () => {
  it("formats slider position as a calendar date and time", () => {
    const { days, hours } = demoDetroitLive();
    expect(formatDemoClockDate(days, hours)).toBe("Jun 30");
    expect(formatDemoClockPosition(days, hours)).toMatch(/Jun 30 · 8:00 PM/);
  });

  it("detects show night by calendar date", () => {
    const { days, hours } = demoDetroitLive();
    expect(isDemoShowNight(days, hours)).toBe(true);
    expect(isDemoShowNight(days - 1, hours)).toBe(false);
  });

  it("builds the Detroit event slug", () => {
    expect(demoDetroitEventSlug()).toBe("the-degens-signal-decay-detroit-2026");
  });
});

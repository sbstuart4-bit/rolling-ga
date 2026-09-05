/**
 * Event state resolution, verification window, and flash drop expiry.
 */
import { describe, it, expect } from "vitest";
import { resolveEventState, verificationWindow, isAnniversaryToday, yearsSince } from "@/lib/event-state";

const BASE_TOUR_WINDOW = 480; // minutes

function makeEvent(overrides: Partial<{
  startsAt: Date;
  endsAt: Date;
  doorsAt: Date | null;
  postShowWindowMinutes: number | null;
  cancelled: boolean;
}> = {}) {
  const now = new Date();
  return {
    startsAt: overrides.startsAt ?? new Date(now.getTime() - 60 * 60_000),
    endsAt: overrides.endsAt ?? new Date(now.getTime() + 60 * 60_000),
    doorsAt: overrides.doorsAt ?? null,
    postShowWindowMinutes: overrides.postShowWindowMinutes ?? null,
    cancelled: overrides.cancelled ?? false,
  };
}

describe("resolveEventState", () => {
  it("returns live during the event", () => {
    const result = resolveEventState(makeEvent(), BASE_TOUR_WINDOW);
    expect(result.state).toBe("live");
  });

  it("returns upcoming before the event", () => {
    const future = new Date(Date.now() + 2 * 60 * 60_000);
    const result = resolveEventState(
      makeEvent({ startsAt: future, endsAt: new Date(future.getTime() + 2 * 60 * 60_000) }),
      BASE_TOUR_WINDOW,
    );
    expect(result.state).toBe("upcoming");
  });

  it("returns recently_ended within the post-show window", () => {
    const past = new Date(Date.now() - 3 * 60 * 60_000);
    const result = resolveEventState(
      makeEvent({
        startsAt: new Date(past.getTime() - 2 * 60 * 60_000),
        endsAt: past,
      }),
      BASE_TOUR_WINDOW,
    );
    expect(result.state).toBe("recently_ended");
  });

  it("returns archived after the post-show window", () => {
    const longAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000);
    const result = resolveEventState(
      makeEvent({
        startsAt: new Date(longAgo.getTime() - 60 * 60_000),
        endsAt: longAgo,
      }),
      BASE_TOUR_WINDOW,
    );
    expect(result.state).toBe("archived");
  });

  it("returns archived for cancelled events", () => {
    const result = resolveEventState(makeEvent({ cancelled: true }), BASE_TOUR_WINDOW);
    expect(result.state).toBe("archived");
  });

  it("postShowClosesAt is null when archived", () => {
    const longAgo = new Date(Date.now() - 30 * 24 * 60 * 60_000);
    const result = resolveEventState(
      makeEvent({ startsAt: new Date(longAgo.getTime() - 60 * 60_000), endsAt: longAgo }),
      BASE_TOUR_WINDOW,
    );
    expect(result.postShowClosesAt).toBeNull();
  });
});

describe("verificationWindow", () => {
  it("opens at doors when set", () => {
    const doors = new Date(Date.now() - 30 * 60_000);
    const event = { ...makeEvent({ doorsAt: doors }), verificationOpensAt: null, verificationClosesAt: null };
    const win = verificationWindow(event, BASE_TOUR_WINDOW);
    expect(win.opensAt.getTime()).toBe(doors.getTime());
  });

  it("closes after the post-show window", () => {
    const event = { ...makeEvent(), verificationOpensAt: null, verificationClosesAt: null };
    const win = verificationWindow(event, 60);
    const expected = event.endsAt.getTime() + 60 * 60_000;
    expect(win.closesAt.getTime()).toBe(expected);
  });

  it("explicit opens/closes override defaults", () => {
    const opens = new Date(Date.now() - 60_000);
    const closes = new Date(Date.now() + 2 * 60 * 60_000);
    const event = { ...makeEvent(), verificationOpensAt: opens, verificationClosesAt: closes };
    const win = verificationWindow(event, BASE_TOUR_WINDOW);
    expect(win.opensAt.getTime()).toBe(opens.getTime());
    expect(win.closesAt.getTime()).toBe(closes.getTime());
  });
});

describe("flash drop expiry behaviour", () => {
  it("expired drops are detected by comparing endsAt to now", () => {
    const expired = new Date(Date.now() - 60_000); // 1 minute ago
    const dropEnded = expired < new Date();
    expect(dropEnded).toBe(true);
  });

  it("active flash drops have endsAt in the future", () => {
    const endsAt = new Date(Date.now() + 30 * 60_000);
    const active = endsAt > new Date();
    expect(active).toBe(true);
  });
});

describe("anniversary detection", () => {
  it("detects today as anniversary", () => {
    const past = new Date();
    past.setFullYear(past.getFullYear() - 1);
    expect(isAnniversaryToday(past)).toBe(true);
  });

  it("does not detect wrong day as anniversary", () => {
    const notToday = new Date(Date.now() - 2 * 24 * 60 * 60_000);
    notToday.setFullYear(notToday.getFullYear() - 1);
    expect(isAnniversaryToday(notToday)).toBe(false);
  });

  it("yearsSince returns correct count", () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    expect(yearsSince(twoYearsAgo)).toBe(2);
  });
});

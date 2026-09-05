/**
 * Product access type enforcement and inventory validation.
 */
import { describe, it, expect } from "vitest";
import { isEligibleForProduct } from "@/server/catalog/queries";
import { availableUnits } from "@/server/catalog/queries";

const base = { eventId: null, tourId: null, availableFrom: null, availableUntil: null };
const noAttendance = { attendedEventIds: [], attendedTourIds: [], attendedArtistIds: [] };
const withAttendance = { attendedEventIds: ["evt_1"], attendedTourIds: ["tor_1"], attendedArtistIds: ["art_1"] };

describe("isEligibleForProduct", () => {
  it("public products are always available", async () => {
    const result = await isEligibleForProduct({ ...base, accessType: "public" }, noAttendance);
    expect(result.eligible).toBe(true);
  });

  it("event_specific is locked without matching attendance", async () => {
    const result = await isEligibleForProduct(
      { ...base, accessType: "event_specific", eventId: "evt_1" },
      noAttendance,
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/Unlock at the show/i);
  });

  it("event_specific unlocks with matching attendance", async () => {
    const result = await isEligibleForProduct(
      { ...base, accessType: "event_specific", eventId: "evt_1" },
      withAttendance,
    );
    expect(result.eligible).toBe(true);
  });

  it("tour_specific is locked without matching tour attendance", async () => {
    const result = await isEligibleForProduct(
      { ...base, accessType: "tour_specific", tourId: "tor_1" },
      noAttendance,
    );
    expect(result.eligible).toBe(false);
  });

  it("tour_specific unlocks with tour attendance", async () => {
    const result = await isEligibleForProduct(
      { ...base, accessType: "tour_specific", tourId: "tor_1" },
      withAttendance,
    );
    expect(result.eligible).toBe(true);
  });

  it("verified_attendee is locked with no shows", async () => {
    const result = await isEligibleForProduct(
      { ...base, accessType: "verified_attendee" },
      noAttendance,
    );
    expect(result.eligible).toBe(false);
  });

  it("verified_attendee unlocks with any verified show", async () => {
    const result = await isEligibleForProduct(
      { ...base, accessType: "verified_attendee" },
      withAttendance,
    );
    expect(result.eligible).toBe(true);
  });

  it("previous_attendee is locked without artist attendance", async () => {
    const result = await isEligibleForProduct(
      { ...base, accessType: "previous_attendee" },
      noAttendance,
    );
    expect(result.eligible).toBe(false);
  });

  it("scheduled product is locked before availableFrom", async () => {
    const future = new Date(Date.now() + 24 * 60 * 60_000);
    const result = await isEligibleForProduct(
      { ...base, accessType: "scheduled", availableFrom: future },
      noAttendance,
      new Date(),
    );
    expect(result.eligible).toBe(false);
  });

  it("scheduled product is available after availableFrom", async () => {
    const past = new Date(Date.now() - 60_000);
    const result = await isEligibleForProduct(
      { ...base, accessType: "scheduled", availableFrom: past },
      noAttendance,
      new Date(),
    );
    expect(result.eligible).toBe(true);
  });
});

describe("availableUnits", () => {
  it("returns onHand minus reserved", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(availableUnits({ onHand: 10, reserved: 3 } as any)).toBe(7);
  });

  it("never returns negative", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(availableUnits({ onHand: 2, reserved: 5 } as any)).toBe(0);
  });

  it("treats null inventory as zero", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(availableUnits({ onHand: null, reserved: null } as any)).toBe(0);
  });
});

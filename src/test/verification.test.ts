/**
 * Event verification, duplicate credential, and expired event behaviour.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db, createUser, createArtist, createVenue, createTour, createEvent, createEventToken } from "./helpers";
import { verifiedAttendance } from "@/db/schema";
import { staffCodeForToken } from "@/server/verification/verifiers";

// The verifiers reach out to the DB via the singleton; in tests we replace it via global.
// Since each test suite uses the same in-memory DB, we test the service layer directly.

async function runVerifier(method: import("@/lib/types").VerificationMethod, request: import("@/server/verification/types").VerificationRequest) {
  const { verifyAttendance } = await import("@/server/verification/service");
  // The service module uses db() which is the singleton — point it at the test db.
  return verifyAttendance(method, request);
}

describe("event QR verification", () => {
  let userId: string;
  let eventId: string;
  let tokenRow: { id: string; token: string };

  beforeEach(async () => {
    const user = await createUser();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const now = new Date();
    const event = await createEvent(artist.id, tour.id, venue.id, {
      startsAt: new Date(now.getTime() - 30 * 60_000),
      endsAt: new Date(now.getTime() + 90 * 60_000),
    });
    const token = await createEventToken(event.id);
    userId = user.id;
    eventId = event.id;
    tokenRow = token;
  });

  it("succeeds with a valid token for a live event", async () => {
    const { verifierFor } = await import("@/server/verification/verifiers");
    const verifier = verifierFor("event_qr");
    const outcome = await verifier.verify({
      userId,
      eventId,
      token: tokenRow.token,
      now: new Date(),
    });
    expect(outcome.ok).toBe(true);
  });

  it("fails with an unknown token", async () => {
    const { verifierFor } = await import("@/server/verification/verifiers");
    const verifier = verifierFor("event_qr");
    const outcome = await verifier.verify({
      userId,
      eventId,
      token: "not-a-real-token",
      now: new Date(),
    });
    expect(outcome.ok).toBe(false);
    expect(!outcome.ok && outcome.reason).toBe("invalid_token");
  });

  it("fails when the event has not started", async () => {
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60_000);
    const futureEvent = await createEvent(artist.id, tour.id, venue.id, {
      startsAt: tomorrow,
      endsAt: new Date(tomorrow.getTime() + 2 * 60 * 60_000),
    });
    const token = await createEventToken(futureEvent.id);
    const user = await createUser();

    const { verifierFor } = await import("@/server/verification/verifiers");
    const verifier = verifierFor("event_qr");
    const outcome = await verifier.verify({
      userId: user.id,
      eventId: futureEvent.id,
      token: token.token,
      now: new Date(),
    });
    expect(outcome.ok).toBe(false);
    expect(!outcome.ok && outcome.reason).toBe("outside_window");
  });
});

describe("staff code", () => {
  it("derives a deterministic six-character code from a token", () => {
    const code = staffCodeForToken("some-test-token");
    expect(code).toHaveLength(6);
    expect(staffCodeForToken("some-test-token")).toBe(code); // deterministic
  });

  it("produces different codes for different tokens", () => {
    expect(staffCodeForToken("token-a")).not.toBe(staffCodeForToken("token-b"));
  });
});

describe("duplicate credential", () => {
  it("returns alreadyVerified instead of inserting a second row", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const now = new Date();
    const event = await createEvent(artist.id, tour.id, venue.id, {
      startsAt: new Date(now.getTime() - 30 * 60_000),
      endsAt: new Date(now.getTime() + 90 * 60_000),
    });
    const token = await createEventToken(event.id);

    // First verification
    const first = await runVerifier("event_qr", {
      userId: user.id,
      eventId: event.id,
      token: token.token,
      now,
    });
    expect(first.ok).toBe(true);
    expect(first.alreadyVerified).toBe(false);

    // Second should detect duplicate
    const second = await runVerifier("event_qr", {
      userId: user.id,
      eventId: event.id,
      token: token.token,
      now,
    });
    expect(second.ok).toBe(true);
    expect(second.alreadyVerified).toBe(true);

    // Still exactly one row in the DB
    const rows = await db()
      .select()
      .from(verifiedAttendance)
      .where(eq(verifiedAttendance.userId, user.id));
    expect(rows.filter((r) => r.eventId === event.id)).toHaveLength(1);
  });
});

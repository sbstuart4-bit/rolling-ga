import { describe, it, expect } from "vitest";
import { and, eq } from "drizzle-orm";
import { artistConsents } from "@/db/schema";
import {
  countGrantedConsents,
  dismissStayConnectedPrompt,
  fanHasMarketingConsent,
  getStayConnectedState,
  grantStayConnected,
  listFanArtistConnections,
  STAY_CONNECTED_CONSENT_TYPES,
  withdrawArtistConnection,
} from "@/server/consent/service";
import {
  createArtist,
  createConsent,
  createEvent,
  createTour,
  createUser,
  createVenue,
  createVerifiedAttendance,
  db,
} from "./helpers";

describe("stay connected consent", () => {
  it("grants artist-specific marketing consent on opt in", async () => {
    const fan = await createUser();
    const artist = await createArtist("Nightfall");

    await grantStayConnected(fan.id, artist.id);

    expect(await fanHasMarketingConsent(fan.id, artist.id)).toBe(true);
    expect(await countGrantedConsents(fan.id, artist.id)).toBe(STAY_CONNECTED_CONSENT_TYPES.length);
    expect(await getStayConnectedState(fan.id, artist.id)).toBe("connected");
  });

  it("records not now without granting marketing permission", async () => {
    const fan = await createUser();
    const artist = await createArtist();

    await dismissStayConnectedPrompt(fan.id, artist.id);

    expect(await fanHasMarketingConsent(fan.id, artist.id)).toBe(false);
    expect(await getStayConnectedState(fan.id, artist.id)).toBe("dismissed");
  });

  it("allows withdrawal from profile and removes granted rows from CRM visibility", async () => {
    const fan = await createUser();
    const artist = await createArtist();

    await grantStayConnected(fan.id, artist.id);
    await withdrawArtistConnection(fan.id, artist.id);

    expect(await fanHasMarketingConsent(fan.id, artist.id)).toBe(false);

    const granted = await db()
      .select()
      .from(artistConsents)
      .where(
        and(
          eq(artistConsents.userId, fan.id),
          eq(artistConsents.artistId, artist.id),
          eq(artistConsents.status, "granted"),
        ),
      );

    expect(granted).toHaveLength(0);
  });

  it("isolates consent per artist", async () => {
    const fan = await createUser();
    const artistA = await createArtist("Artist A");
    const artistB = await createArtist("Artist B");

    await grantStayConnected(fan.id, artistA.id);

    expect(await fanHasMarketingConsent(fan.id, artistA.id)).toBe(true);
    expect(await fanHasMarketingConsent(fan.id, artistB.id)).toBe(false);
  });

  it("does not create duplicate granted rows on repeat opt in", async () => {
    const fan = await createUser();
    const artist = await createArtist();

    await grantStayConnected(fan.id, artist.id);
    await grantStayConnected(fan.id, artist.id);

    const rows = await db()
      .select()
      .from(artistConsents)
      .where(and(eq(artistConsents.userId, fan.id), eq(artistConsents.artistId, artist.id)));

    expect(rows).toHaveLength(STAY_CONNECTED_CONSENT_TYPES.length);
    expect(rows.every((row) => row.status === "granted")).toBe(true);
  });

  it("does not treat verified attendance as marketing permission", async () => {
    const fan = await createUser();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);

    await createVerifiedAttendance(fan.id, event.id);

    expect(await fanHasMarketingConsent(fan.id, artist.id)).toBe(false);
    expect(await getStayConnectedState(fan.id, artist.id)).toBe("prompt");
  });

  it("lists profile connections with show context after opt in", async () => {
    const fan = await createUser();
    const artist = await createArtist("Nightfall");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id, {
      startsAt: new Date("2027-09-12T20:00:00Z"),
      endsAt: new Date("2027-09-12T23:00:00Z"),
    });

    await createVerifiedAttendance(fan.id, event.id);
    await grantStayConnected(fan.id, artist.id);

    const connections = await listFanArtistConnections(fan.id);
    expect(connections).toHaveLength(1);
    expect(connections[0].artistName).toBe("Nightfall");
    expect(connections[0].contextCity).toBe("Detroit");
    expect(connections[0].emailOptIn).toBe(true);
  });

  it("legacy single-type consent still counts for CRM queries", async () => {
    const fan = await createUser();
    const artist = await createArtist();
    await createConsent(fan.id, artist.id, "drops");

    expect(await fanHasMarketingConsent(fan.id, artist.id, "drops")).toBe(true);
    expect(await fanHasMarketingConsent(fan.id, artist.id, "attendee_offers")).toBe(false);
  });
});

/**
 * Artist Studio tenant isolation.
 *
 * Two things are covered: the shows a Studio page is allowed to read, and the entities a
 * flash drop is allowed to reference. Both are places where a team member on one artist
 * could otherwise reach another artist's records.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { dropProducts, drops } from "@/db/schema";
import {
  db,
  createUser,
  createArtist,
  createVenue,
  createTour,
  createEvent,
  createProduct,
  authContextFor,
  membershipFor,
} from "./helpers";

const getAuthContext = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
vi.mock("@/server/auth/session", () => ({ getAuthContext }));

import { createFlashDropAction } from "@/server/studio/drop-actions";
import { listLiveEventsForArtist, listUpcomingEventsForArtist } from "@/server/events/queries";
import { demoNow } from "@/server/demo/clock";

function form(fields: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const entry of Array.isArray(value) ? value : [value]) data.append(key, entry);
  }
  return data;
}

async function twoArtistsWithShows() {
  const venue = await createVenue();
  const now = demoNow();

  const artistA = await createArtist("Artist A");
  const tourA = await createTour(artistA.id);
  const liveA = await createEvent(artistA.id, tourA.id, venue.id, {
    startsAt: new Date(now.getTime() - 60 * 60_000),
    endsAt: new Date(now.getTime() + 60 * 60_000),
  });
  const upcomingA = await createEvent(artistA.id, tourA.id, venue.id, {
    startsAt: new Date(now.getTime() + 7 * 24 * 60 * 60_000),
    endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60_000 + 2 * 60 * 60_000),
  });

  const artistB = await createArtist("Artist B");
  const tourB = await createTour(artistB.id);
  const liveB = await createEvent(artistB.id, tourB.id, venue.id, {
    startsAt: new Date(now.getTime() - 60 * 60_000),
    endsAt: new Date(now.getTime() + 60 * 60_000),
  });
  const upcomingB = await createEvent(artistB.id, tourB.id, venue.id, {
    startsAt: new Date(now.getTime() + 7 * 24 * 60 * 60_000),
    endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60_000 + 2 * 60 * 60_000),
  });

  return { artistA, artistB, liveA, liveB, upcomingA, upcomingB };
}

beforeEach(() => {
  getAuthContext.mockReset();
});

describe("Studio Live — show scoping", () => {
  it("returns only the acting artist's live shows", async () => {
    const { artistA, liveA, liveB } = await twoArtistsWithShows();

    const ids = (await listLiveEventsForArtist(artistA.id)).map((e) => e.id);

    expect(ids).toContain(liveA.id);
    expect(ids).not.toContain(liveB.id);
  });

  it("returns only the acting artist's upcoming shows", async () => {
    const { artistA, upcomingA, upcomingB } = await twoArtistsWithShows();

    const ids = (await listUpcomingEventsForArtist(artistA.id, 20)).map((e) => e.id);

    expect(ids).toContain(upcomingA.id);
    expect(ids).not.toContain(upcomingB.id);
  });
});

describe("flash drop creation — entity ownership", () => {
  it("rejects a show belonging to another artist", async () => {
    const user = await createUser();
    const { artistA, artistB, liveB } = await twoArtistsWithShows();
    const productA = await createProduct(artistA.id);
    getAuthContext.mockResolvedValue(
      authContextFor(user, {
        roles: ["artist_member"],
        memberships: [membershipFor(artistA), membershipFor(artistB)],
      }),
    );

    const result = await createFlashDropAction(
      {},
      form({
        artistId: artistA.id,
        title: "Cross-tenant drop",
        eventId: liveB.id,
        durationMinutes: "60",
        productIds: [productA.id],
        confirm: "true",
      }),
    );

    expect(result.error).toBeTruthy();
    expect(await db().select().from(drops).where(eq(drops.artistId, artistA.id))).toHaveLength(0);
  });

  it("rejects a product belonging to another artist", async () => {
    const user = await createUser();
    const { artistA, artistB, liveA } = await twoArtistsWithShows();
    const productA = await createProduct(artistA.id);
    const productB = await createProduct(artistB.id);
    getAuthContext.mockResolvedValue(
      authContextFor(user, {
        roles: ["artist_member"],
        memberships: [membershipFor(artistA), membershipFor(artistB)],
      }),
    );

    const result = await createFlashDropAction(
      {},
      form({
        artistId: artistA.id,
        title: "Cross-tenant drop",
        eventId: liveA.id,
        durationMinutes: "60",
        productIds: [productA.id, productB.id],
        confirm: "true",
      }),
    );

    expect(result.error).toBeTruthy();
    expect(await db().select().from(drops).where(eq(drops.artistId, artistA.id))).toHaveLength(0);
  });

  it("rejects a show that does not exist", async () => {
    const user = await createUser();
    const { artistA } = await twoArtistsWithShows();
    const productA = await createProduct(artistA.id);
    getAuthContext.mockResolvedValue(
      authContextFor(user, {
        roles: ["artist_member"],
        memberships: [membershipFor(artistA)],
      }),
    );

    const result = await createFlashDropAction(
      {},
      form({
        artistId: artistA.id,
        title: "Ghost show drop",
        eventId: "evt_does_not_exist",
        durationMinutes: "60",
        productIds: [productA.id],
        confirm: "true",
      }),
    );

    expect(result.error).toBeTruthy();
  });

  it("publishes when the show and products are the artist's own", async () => {
    const user = await createUser();
    const { artistA, liveA } = await twoArtistsWithShows();
    const productA = await createProduct(artistA.id);
    getAuthContext.mockResolvedValue(
      authContextFor(user, {
        roles: ["artist_member"],
        memberships: [membershipFor(artistA)],
      }),
    );

    // The action redirects to the drops list on success.
    await expect(
      createFlashDropAction(
        {},
        form({
          artistId: artistA.id,
          title: "Encore tee",
          eventId: liveA.id,
          durationMinutes: "45",
          productIds: [productA.id],
          confirm: "true",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    const created = await db().select().from(drops).where(eq(drops.artistId, artistA.id));
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      title: "Encore tee",
      eventId: liveA.id,
      status: "live",
      exclusivityType: "flash",
    });

    const linked = await db()
      .select()
      .from(dropProducts)
      .where(eq(dropProducts.dropId, created[0].id));
    expect(linked.map((l) => l.productId)).toEqual([productA.id]);
  });

  it("rejects a duplicated cross-artist product even when a valid product is present", async () => {
    const user = await createUser();
    const { artistA, artistB, liveA } = await twoArtistsWithShows();
    const productA = await createProduct(artistA.id);
    const productB = await createProduct(artistB.id);
    getAuthContext.mockResolvedValue(
      authContextFor(user, {
        roles: ["artist_member"],
        memberships: [membershipFor(artistA), membershipFor(artistB)],
      }),
    );

    const result = await createFlashDropAction(
      {},
      form({
        artistId: artistA.id,
        title: "Cross-tenant drop",
        eventId: liveA.id,
        durationMinutes: "60",
        productIds: [productA.id, productA.id, productB.id],
        confirm: "true",
      }),
    );

    expect(result.error).toBeTruthy();
    expect(await db().select().from(drops).where(eq(drops.artistId, artistA.id))).toHaveLength(0);
  });
});

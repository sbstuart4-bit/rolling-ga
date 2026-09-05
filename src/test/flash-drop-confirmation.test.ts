/**
 * Flash drop preview and confirmation.
 *
 * A flash drop goes live the moment it is created, so the workflow is deliberately two
 * passes: validate and show the artist what is about to happen, then publish only on an
 * explicit second submission. These tests hold both halves — that the preview is
 * reachable and writes nothing, and that only an exact confirmation publishes.
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
import { demoNow } from "@/server/demo/clock";

function form(fields: Record<string, string | string[] | undefined>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    for (const entry of Array.isArray(value) ? value : [value]) data.append(key, entry);
  }
  return data;
}

// Scoped to one artist: the suite shares a database, so a global count would see rows
// left behind by earlier tests.
async function dropsFor(artistId: string) {
  return db().select().from(drops).where(eq(drops.artistId, artistId));
}

async function linkedProductsFor(artistId: string) {
  return db()
    .select({ dropId: dropProducts.dropId, productId: dropProducts.productId })
    .from(dropProducts)
    .innerJoin(drops, eq(drops.id, dropProducts.dropId))
    .where(eq(drops.artistId, artistId));
}

/** One artist with a live show and two products, plus a second artist to intrude with. */
async function scenario({ canPublish = true }: { canPublish?: boolean } = {}) {
  const user = await createUser();
  const venue = await createVenue();
  const now = demoNow();

  const artistA = await createArtist("Artist A");
  const tourA = await createTour(artistA.id);
  const showA = await createEvent(artistA.id, tourA.id, venue.id, {
    startsAt: new Date(now.getTime() - 60 * 60_000),
    endsAt: new Date(now.getTime() + 60 * 60_000),
  });
  const productA = await createProduct(artistA.id, { name: "Encore Tee" });
  const secondA = await createProduct(artistA.id, { name: "Tour Poster" });

  const artistB = await createArtist("Artist B");
  const tourB = await createTour(artistB.id);
  const showB = await createEvent(artistB.id, tourB.id, venue.id, {
    startsAt: new Date(now.getTime() - 60 * 60_000),
    endsAt: new Date(now.getTime() + 60 * 60_000),
  });
  const productB = await createProduct(artistB.id, { name: "Someone Else's Hoodie" });

  getAuthContext.mockResolvedValue(
    authContextFor(user, {
      roles: ["artist_member"],
      // Membership of both artists, so any refusal is the entity check rather than
      // the artist guard.
      memberships: [membershipFor(artistA, canPublish), membershipFor(artistB, canPublish)],
    }),
  );

  return { user, artistA, artistB, showA, showB, productA, secondA, productB };
}

/** A well-formed submission for artist A. `confirm` is supplied per test. */
function submissionFor(
  s: Awaited<ReturnType<typeof scenario>>,
  overrides: Record<string, string | string[] | undefined> = {},
) {
  return form({
    artistId: s.artistA.id,
    title: "Midnight Merch",
    description: "Two hours only",
    eventId: s.showA.id,
    durationMinutes: "120",
    productIds: [s.productA.id],
    ...overrides,
  });
}

beforeEach(() => {
  getAuthContext.mockReset();
});

describe("flash drop preview path", () => {
  it("reaches the preview when confirm is false", async () => {
    const s = await scenario();

    const result = await createFlashDropAction({}, submissionFor(s, { confirm: "false" }));

    expect(result.error).toBeUndefined();
    expect(result.preview).toMatchObject({
      title: "Midnight Merch",
      description: "Two hours only",
      eventId: s.showA.id,
      durationMinutes: 120,
      productCount: 1,
    });
    expect(result.preview?.productIds).toEqual([s.productA.id]);
  });

  it("reaches the preview when confirm is absent entirely", async () => {
    const s = await scenario();

    const result = await createFlashDropAction({}, submissionFor(s));

    expect(result.error).toBeUndefined();
    expect(result.preview?.title).toBe("Midnight Merch");
  });

  it("writes nothing at all during a preview", async () => {
    const s = await scenario();

    await createFlashDropAction({}, submissionFor(s, { confirm: "false" }));

    expect(await dropsFor(s.artistA.id)).toHaveLength(0);
    expect(await dropsFor(s.artistB.id)).toHaveLength(0);
    expect(await linkedProductsFor(s.artistA.id)).toHaveLength(0);
  });

  it("returns a preview the confirming submission can be rebuilt from", async () => {
    const s = await scenario();

    const preview = await createFlashDropAction(
      {},
      submissionFor(s, { confirm: "false", productIds: [s.productA.id, s.secondA.id] }),
    );
    expect(preview.preview).toBeDefined();

    // Exactly what the form posts back from the preview screen.
    await expect(
      createFlashDropAction(
        {},
        form({
          artistId: s.artistA.id,
          title: preview.preview!.title,
          description: preview.preview!.description,
          eventId: preview.preview!.eventId,
          durationMinutes: String(preview.preview!.durationMinutes),
          productIds: preview.preview!.productIds,
          confirm: "true",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/studio/drops");

    const created = await dropsFor(s.artistA.id);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      title: "Midnight Merch",
      description: "Two hours only",
      eventId: s.showA.id,
      status: "live",
      exclusivityType: "flash",
    });

    const linked = await linkedProductsFor(s.artistA.id);
    expect(linked.map((l) => l.productId).sort()).toEqual([s.productA.id, s.secondA.id].sort());
  });
});

describe("flash drop confirmed path", () => {
  it("creates the drop when confirm is exactly true", async () => {
    const s = await scenario();

    await expect(
      createFlashDropAction({}, submissionFor(s, { confirm: "true" })),
    ).rejects.toThrow("NEXT_REDIRECT:/studio/drops");

    const created = await dropsFor(s.artistA.id);
    expect(created).toHaveLength(1);
    expect(created[0].artistId).toBe(s.artistA.id);
    expect(created[0].endsAt).not.toBeNull();
    expect(created[0].endsAt!.getTime() - created[0].startsAt.getTime()).toBe(120 * 60_000);
  });
});

describe("flash drop confirmation values", () => {
  // Anything that is not exactly "true" or "false" is refused rather than guessed at.
  const malformed = ["TRUE", "True", "1", "yes", "on", "", " true", "publish", "0"];

  for (const value of malformed) {
    it(`rejects a confirmation of ${JSON.stringify(value)} without writing`, async () => {
      const s = await scenario();

      const result = await createFlashDropAction({}, submissionFor(s, { confirm: value }));

      expect(result.error).toBeTruthy();
      expect(result.preview).toBeUndefined();
      expect(await dropsFor(s.artistA.id)).toHaveLength(0);
    });
  }
});

describe("flash drop tenancy on both paths", () => {
  it("refuses to preview another artist's show", async () => {
    const s = await scenario();

    const result = await createFlashDropAction(
      {},
      submissionFor(s, { confirm: "false", eventId: s.showB.id }),
    );

    expect(result.error).toBeTruthy();
    expect(result.preview).toBeUndefined();
  });

  it("refuses to preview another artist's product", async () => {
    const s = await scenario();

    const result = await createFlashDropAction(
      {},
      submissionFor(s, { confirm: "false", productIds: [s.productB.id] }),
    );

    expect(result.error).toBeTruthy();
    expect(result.preview).toBeUndefined();
  });

  it("refuses to preview a mix of own and foreign products", async () => {
    const s = await scenario();

    const result = await createFlashDropAction(
      {},
      submissionFor(s, { confirm: "false", productIds: [s.productA.id, s.productB.id] }),
    );

    expect(result.error).toBeTruthy();
    expect(result.preview).toBeUndefined();
  });

  it("refuses to create with another artist's product", async () => {
    const s = await scenario();

    const result = await createFlashDropAction(
      {},
      submissionFor(s, { confirm: "true", productIds: [s.productA.id, s.productB.id] }),
    );

    expect(result.error).toBeTruthy();
    expect(await dropsFor(s.artistA.id)).toHaveLength(0);
  });

  it("requires publish rights to preview, not just to create", async () => {
    const s = await scenario({ canPublish: false });

    await expect(
      createFlashDropAction({}, submissionFor(s, { confirm: "false" })),
    ).rejects.toThrow(/cannot publish/i);

    expect(await dropsFor(s.artistA.id)).toHaveLength(0);
  });
});

describe("flash drop duplicate products", () => {
  it("collapses duplicates in the preview count", async () => {
    const s = await scenario();

    const result = await createFlashDropAction(
      {},
      submissionFor(s, { confirm: "false", productIds: [s.productA.id, s.productA.id] }),
    );

    expect(result.error).toBeUndefined();
    expect(result.preview?.productIds).toEqual([s.productA.id]);
    expect(result.preview?.productCount).toBe(1);
  });

  it("publishes duplicates as one row without violating the unique index", async () => {
    const s = await scenario();

    await expect(
      createFlashDropAction(
        {},
        submissionFor(s, {
          confirm: "true",
          productIds: [s.productA.id, s.productA.id, s.productA.id],
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/studio/drops");

    const created = await dropsFor(s.artistA.id);
    expect(created).toHaveLength(1);

    const linked = await linkedProductsFor(s.artistA.id);
    expect(linked).toHaveLength(1);
    expect(linked[0].productId).toBe(s.productA.id);
  });
});

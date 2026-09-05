/**
 * PostgreSQL dialect regressions.
 *
 * These assert the things the SQLite schema could not express: real booleans, timezone
 * aware timestamps with database defaults, jsonb round-trips, enforced foreign keys,
 * CHECK-constrained state columns, and uuid user identifiers alongside prefixed text
 * ids for every other entity.
 */
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  artistConsents,
  artistMembers,
  artists,
  campaigns,
  events,
  fanPreferences,
  orders,
  productVariants,
  products,
  users,
} from "@/db/schema";
import {
  isUniqueViolation,
  PG_CHECK_VIOLATION,
  PG_FOREIGN_KEY_VIOLATION,
  PG_INVALID_TEXT_REPRESENTATION,
  PG_UNIQUE_VIOLATION,
  sqlStateOf,
} from "@/db/errors";
import {
  createArtist,
  createEvent,
  createProduct,
  createTour,
  createUser,
  createVariantWithInventory,
  createVenue,
  db,
} from "./helpers";

/**
 * Runs an operation expected to fail and reports its SQLSTATE. Returns a descriptive
 * marker instead of `undefined` when the operation succeeds or raises something without
 * a SQLSTATE, so a failing assertion says what actually happened.
 */
async function errorCodeOf(operation: () => Promise<unknown>): Promise<string> {
  try {
    await operation();
    return "NO_ERROR_RAISED";
  } catch (error) {
    const state = sqlStateOf(error);
    if (state) return state;
    return `NO_SQLSTATE: ${(error as Error)?.message ?? String(error)}`;
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("booleans", () => {
  it("stores and returns real booleans rather than integers", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id, { active: false });

    expect(product.active).toBe(false);
    expect(product.isDigital).toBe(false);
    expect(product.isDemo).toBe(false);

    const [row] = await db().select().from(products).where(eq(products.id, product.id));
    expect(row.active).toBe(false);
    expect(typeof row.active).toBe("boolean");
  });

  it("applies boolean column defaults from the database", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id);
    const [variant] = await db()
      .insert(productVariants)
      .values({ productId: product.id, sku: `sku_${product.id}` })
      .returning();

    // `active` defaults to true, `is_demo` to false, neither supplied above.
    expect(variant.active).toBe(true);
    expect(variant.isDemo).toBe(false);
  });

  it("filters on booleans without integer coercion", async () => {
    const artist = await createArtist();
    await createProduct(artist.id, { active: true });
    await createProduct(artist.id, { active: false });

    const active = await db().select().from(products).where(eq(products.active, true));
    const inactive = await db().select().from(products).where(eq(products.active, false));

    expect(active.length).toBeGreaterThanOrEqual(1);
    expect(inactive.length).toBeGreaterThanOrEqual(1);
    expect(active.every((row) => row.active === true)).toBe(true);
  });
});

describe("timestamps", () => {
  it("defaults created_at and updated_at in the database", async () => {
    const before = Date.now();
    // No timestamp is supplied, so the columns' `DEFAULT now()` has to produce them.
    const [artist] = await db()
      .insert(artists)
      .values({ slug: `slug_${Date.now()}_${Math.random()}`, name: "Defaults" })
      .returning();

    expect(artist.createdAt).toBeInstanceOf(Date);
    expect(artist.updatedAt).toBeInstanceOf(Date);
    expect(artist.createdAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(artist.createdAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it("bumps updated_at on writes that bypass the ORM", async () => {
    const artist = await createArtist();
    const past = new Date("2020-01-01T00:00:00.000Z");

    await db()
      .update(artists)
      .set({ updatedAt: past, createdAt: past })
      .where(eq(artists.id, artist.id));

    // Drizzle's `$onUpdateFn` is not involved here: the statement never mentions
    // updated_at, so only the `set_updated_at` trigger can move it.
    await db().execute(sql`update ${artists} set name = 'Renamed' where id = ${artist.id}`);

    const [row] = await db().select().from(artists).where(eq(artists.id, artist.id));
    expect(row.name).toBe("Renamed");
    expect(row.updatedAt.getTime()).toBeGreaterThan(past.getTime());
    // created_at is left exactly where it was.
    expect(row.createdAt.getTime()).toBe(past.getTime());
  });

  it("preserves the instant across timezones", async () => {
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);

    // Same moment, expressed in two different zones.
    const startsAt = new Date("2027-06-30T23:30:00.000Z");
    const endsAt = new Date("2027-07-01T02:00:00+02:00");

    const event = await createEvent(artist.id, tour.id, venue.id, { startsAt, endsAt });

    const [row] = await db().select().from(events).where(eq(events.id, event.id));
    expect(row.startsAt).toBeInstanceOf(Date);
    expect(row.startsAt.getTime()).toBe(startsAt.getTime());
    expect(row.endsAt.getTime()).toBe(endsAt.getTime());
    expect(row.startsAt.toISOString()).toBe("2027-06-30T23:30:00.000Z");
  });

  it("keeps sub-second precision", async () => {
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const startsAt = new Date("2027-06-30T20:15:30.123Z");

    const event = await createEvent(artist.id, tour.id, venue.id, { startsAt });
    const [row] = await db().select().from(events).where(eq(events.id, event.id));

    expect(row.startsAt.getMilliseconds()).toBe(123);
  });
});

describe("jsonb", () => {
  it("round-trips a string array without manual serialisation", async () => {
    const artist = await createArtist();
    const images = ["/a.png", "/b.png", "/c.png"];
    const product = await createProduct(artist.id, { images });

    const [row] = await db().select().from(products).where(eq(products.id, product.id));
    expect(row.images).toEqual(images);
    expect(Array.isArray(row.images)).toBe(true);
  });

  it("round-trips typed arrays and nested objects", async () => {
    const user = await createUser();
    await db()
      .insert(fanPreferences)
      .values({ userId: user.id, preferredCategories: ["apparel", "print", "music"] });

    const [prefs] = await db()
      .select()
      .from(fanPreferences)
      .where(eq(fanPreferences.userId, user.id));
    expect(prefs.preferredCategories).toEqual(["apparel", "print", "music"]);

    const artist = await createArtist();
    const [campaign] = await db()
      .insert(campaigns)
      .values({
        artistId: artist.id,
        kind: "flash_drop",
        title: "Encore",
        body: "Ten minutes only.",
        channels: ["in_app", "email"],
      })
      .returning();
    expect(campaign.channels).toEqual(["in_app", "email"]);
  });

  it("is queryable as jsonb rather than opaque text", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id, { images: ["/only.png"] });

    // jsonb operators would fail outright against a text column.
    const rows = await db()
      .select({ length: sql<number>`jsonb_array_length(${products.images})` })
      .from(products)
      .where(eq(products.id, product.id));

    expect(Number(rows[0].length)).toBe(1);
  });

  it("stores null rather than the string 'null' when absent", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id);

    const [row] = await db().select().from(products).where(eq(products.id, product.id));
    expect(row.images).toBeNull();
  });
});

describe("unique constraints", () => {
  it("raises 23505 on a duplicate user email", async () => {
    const user = await createUser();

    const code = await errorCodeOf(() =>
      db().insert(users).values({
        email: user.email,
        displayName: "Impostor",
        passwordHash: "hash",
      }),
    );

    expect(code).toBe(PG_UNIQUE_VIOLATION);
  });

  it("raises 23505 on a duplicate product sku", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id);

    const code = await errorCodeOf(() =>
      db()
        .insert(products)
        .values({
          artistId: artist.id,
          slug: `${product.slug}-other`,
          name: "Duplicate SKU",
          category: "apparel",
          basePriceCents: 1000,
          sku: product.sku,
        }),
    );

    expect(code).toBe(PG_UNIQUE_VIOLATION);
  });

  it("enforces one consent row per user, artist and type", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const row = {
      userId: user.id,
      artistId: artist.id,
      consentType: "drops" as const,
      status: "granted" as const,
      source: "checkout" as const,
    };

    await db().insert(artistConsents).values(row);
    const code = await errorCodeOf(() => db().insert(artistConsents).values(row));

    expect(code).toBe(PG_UNIQUE_VIOLATION);
  });

  it("lets ON CONFLICT DO NOTHING absorb a duplicate without an error", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const row = {
      userId: user.id,
      artistId: artist.id,
      consentType: "anniversary" as const,
      status: "granted" as const,
      source: "checkout" as const,
    };

    await db().insert(artistConsents).values(row);
    await expect(
      db().insert(artistConsents).values(row).onConflictDoNothing(),
    ).resolves.toBeDefined();

    const rows = await db()
      .select()
      .from(artistConsents)
      .where(eq(artistConsents.userId, user.id));
    expect(rows).toHaveLength(1);
  });

  it("classifies a unique violation through the shared helper", async () => {
    const user = await createUser();

    try {
      await db().insert(users).values({
        email: user.email,
        displayName: "Impostor",
        passwordHash: "hash",
      });
      expect.fail("expected a unique violation");
    } catch (error) {
      expect(isUniqueViolation(error)).toBe(true);
    }
  });
});

describe("foreign keys", () => {
  it("rejects an artist_members row for an artist that does not exist", async () => {
    const user = await createUser();

    // This constraint did not exist under SQLite.
    const code = await errorCodeOf(() =>
      db().insert(artistMembers).values({
        artistId: "art_does_not_exist",
        userId: user.id,
        role: "management",
      }),
    );

    expect(code).toBe(PG_FOREIGN_KEY_VIOLATION);
  });

  it("rejects an artist_consents row for an artist that does not exist", async () => {
    const user = await createUser();

    const code = await errorCodeOf(() =>
      db().insert(artistConsents).values({
        artistId: "art_does_not_exist",
        userId: user.id,
        consentType: "drops",
        status: "granted",
        source: "checkout",
      }),
    );

    expect(code).toBe(PG_FOREIGN_KEY_VIOLATION);
  });

  it("cascades a delete from artists to its memberships", async () => {
    const user = await createUser();
    const artist = await createArtist();
    await db()
      .insert(artistMembers)
      .values({ artistId: artist.id, userId: user.id, role: "management" });

    await db().delete(artists).where(eq(artists.id, artist.id));

    const remaining = await db()
      .select()
      .from(artistMembers)
      .where(eq(artistMembers.userId, user.id));
    expect(remaining).toHaveLength(0);
  });
});

describe("check constraints", () => {
  it("rejects an unknown product category", async () => {
    const artist = await createArtist();

    const code = await errorCodeOf(() =>
      db()
        .insert(products)
        .values({
          artistId: artist.id,
          slug: `bogus_${Date.now()}`,
          name: "Bogus",
          // Bypasses the TypeScript union deliberately: the database is the last line.
          category: "spaceship" as never,
          basePriceCents: 1000,
          sku: `bogus_${Date.now()}`,
        }),
    );

    expect(code).toBe(PG_CHECK_VIOLATION);
  });

  it("rejects an unknown artist member role", async () => {
    const artist = await createArtist();
    const user = await createUser();

    const code = await errorCodeOf(() =>
      db()
        .insert(artistMembers)
        .values({ artistId: artist.id, userId: user.id, role: "wizard" as never }),
    );

    expect(code).toBe(PG_CHECK_VIOLATION);
  });

  it("rejects an unknown order status", async () => {
    const artist = await createArtist();
    const user = await createUser();

    const code = await errorCodeOf(() =>
      db()
        .insert(orders)
        .values({
          orderNumber: `RGA-${Date.now()}`,
          userId: user.id,
          artistId: artist.id,
          status: "teleported" as never,
          subtotalCents: 1000,
          totalCents: 1000,
        }),
    );

    expect(code).toBe(PG_CHECK_VIOLATION);
  });

  it("still accepts null in a nullable constrained column", async () => {
    const artist = await createArtist();
    const [campaign] = await db()
      .insert(campaigns)
      .values({
        artistId: artist.id,
        kind: "product_alert",
        title: "Back in stock",
        body: "The tee is back.",
        channels: ["in_app"],
      })
      .returning();

    // `campaigns.status` is constrained but defaulted; `queued_reason` is free text.
    expect(campaign.status).toBe("draft");
    expect(campaign.queuedReason).toBeNull();
  });
});

describe("identifiers", () => {
  it("gives users a database-generated uuid", async () => {
    const user = await createUser();

    expect(user.id).toMatch(UUID_PATTERN);
  });

  it("rejects a non-uuid user reference", async () => {
    const code = await errorCodeOf(() =>
      db().insert(fanPreferences).values({ userId: "usr_not_a_uuid" }),
    );

    expect(code).toBe(PG_INVALID_TEXT_REPRESENTATION);
  });

  it("rejects a well-formed uuid that references no user", async () => {
    const code = await errorCodeOf(() =>
      db()
        .insert(fanPreferences)
        .values({ userId: "00000000-0000-4000-8000-000000000000" }),
    );

    expect(code).toBe(PG_FOREIGN_KEY_VIOLATION);
  });

  it("joins across uuid user references", async () => {
    const user = await createUser();
    await db().insert(fanPreferences).values({ userId: user.id, apparelSize: "L" });

    const rows = await db()
      .select({ email: users.email, size: fanPreferences.apparelSize })
      .from(users)
      .innerJoin(fanPreferences, eq(fanPreferences.userId, users.id))
      .where(eq(users.id, user.id));

    expect(rows).toEqual([{ email: user.email, size: "L" }]);
  });

  it("keeps prefixed text ids for every other entity", async () => {
    // Ids are omitted so the schema's own `newId` defaults have to produce them.
    const [artist] = await db()
      .insert(artists)
      .values({ slug: `prefixed_${Date.now()}`, name: "Prefixed" })
      .returning();
    expect(artist.id).toMatch(/^art_[0-9a-f]{20}$/);

    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const product = await createProduct(artist.id);
    const variant = await createVariantWithInventory(product.id);

    // Helper-created rows carry explicit ids, but the prefix convention is unchanged.
    expect(venue.id.startsWith("ven_")).toBe(true);
    expect(tour.id.startsWith("tor_")).toBe(true);
    expect(event.id.startsWith("evt_")).toBe(true);
    expect(product.id.startsWith("prd_")).toBe(true);
    expect(variant.id.startsWith("var_")).toBe(true);

    // And they are text columns, not uuid: a non-uuid value is perfectly valid.
    expect(artist.id).not.toMatch(UUID_PATTERN);
  });
});

describe("numeric columns", () => {
  it("keeps money as integer cents", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id, {
      basePriceCents: 4599,
      unitCostCents: 1210,
    });

    const [row] = await db().select().from(products).where(eq(products.id, product.id));
    expect(row.basePriceCents).toBe(4599);
    expect(row.unitCostCents).toBe(1210);
    expect(Number.isInteger(row.basePriceCents)).toBe(true);
  });

  it("keeps venue coordinates as floating point", async () => {
    const venue = await createVenue();

    expect(venue.lat).toBeCloseTo(42.33, 5);
    expect(venue.lng).toBeCloseTo(-83.05, 5);
    expect(Number.isInteger(venue.lat)).toBe(false);
  });
});

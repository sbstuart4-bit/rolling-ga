/**
 * Artist consent / fan CRM isolation.
 */
import { describe, it, expect } from "vitest";
import { and, eq } from "drizzle-orm";
import { artistConsents } from "@/db/schema";
import { db, createUser, createArtist, createConsent } from "./helpers";

describe("consent management", () => {
  it("fan without consent is not visible to artist CRM", async () => {
    const fan = await createUser();
    const artist = await createArtist();

    // No consent row created — CRM query should find nothing
    const rows = await db()
      .select()
      .from(artistConsents)
      .where(
        and(
          eq(artistConsents.userId, fan.id),
          eq(artistConsents.artistId, artist.id),
          eq(artistConsents.status, "granted"),
        ),
      );

    expect(rows).toHaveLength(0);
  });

  it("fan with granted consent is visible", async () => {
    const fan = await createUser();
    const artist = await createArtist();
    await createConsent(fan.id, artist.id, "drops");

    const rows = await db()
      .select()
      .from(artistConsents)
      .where(
        and(
          eq(artistConsents.userId, fan.id),
          eq(artistConsents.artistId, artist.id),
          eq(artistConsents.status, "granted"),
        ),
      );

    expect(rows).toHaveLength(1);
    expect(rows[0].consentType).toBe("drops");
  });

  it("withdrawn consent removes CRM visibility", async () => {
    const fan = await createUser();
    const artist = await createArtist();
    const consent = await createConsent(fan.id, artist.id, "drops");

    await db()
      .update(artistConsents)
      .set({ status: "withdrawn", revokedAt: new Date() })
      .where(eq(artistConsents.id, consent.id));

    const rows = await db()
      .select()
      .from(artistConsents)
      .where(
        and(
          eq(artistConsents.userId, fan.id),
          eq(artistConsents.artistId, artist.id),
          eq(artistConsents.status, "granted"),
        ),
      );

    expect(rows).toHaveLength(0);
  });

  it("fan A's consent does not affect fan B's visibility", async () => {
    const fanA = await createUser();
    const fanB = await createUser();
    const artist = await createArtist();
    await createConsent(fanA.id, artist.id, "drops");

    const fanBRows = await db()
      .select()
      .from(artistConsents)
      .where(
        and(
          eq(artistConsents.userId, fanB.id),
          eq(artistConsents.artistId, artist.id),
          eq(artistConsents.status, "granted"),
        ),
      );

    expect(fanBRows).toHaveLength(0);
  });
});

describe("artist tenant isolation", () => {
  it("consent for artist A does not appear in artist B's CRM", async () => {
    const fan = await createUser();
    const artistA = await createArtist("Artist A");
    const artistB = await createArtist("Artist B");
    await createConsent(fan.id, artistA.id, "drops");

    const rows = await db()
      .select()
      .from(artistConsents)
      .where(
        and(
          eq(artistConsents.artistId, artistB.id),
          eq(artistConsents.status, "granted"),
        ),
      );

    // Fan's consent for A should not appear under B
    expect(rows.filter((r) => r.userId === fan.id)).toHaveLength(0);
  });
});

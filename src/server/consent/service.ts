import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artistConsents, artists, events, fanPreferences, verifiedAttendance, venues } from "@/db/schema";
import type { ConsentSource, ConsentType, StayConnectedState } from "@/lib/types";

/** Consent bundle granted when a fan chooses to stay connected with an artist. */
export const STAY_CONNECTED_CONSENT_TYPES = [
  "drops",
  "show_news",
  "attendee_offers",
  "anniversary",
] as const satisfies readonly ConsentType[];

export type { StayConnectedState };

export interface ArtistConnectionView {
  artistId: string;
  artistName: string;
  artistSlug: string;
  connectedAt: Date;
  contextCity: string | null;
  contextStartsAt: Date | null;
  contextTimezone: string | null;
  emailOptIn: boolean;
  smsOptIn: boolean;
  consents: Record<(typeof STAY_CONNECTED_CONSENT_TYPES)[number], boolean>;
}

async function consentRowsForArtist(userId: string, artistId: string) {
  return db
    .select()
    .from(artistConsents)
    .where(and(eq(artistConsents.userId, userId), eq(artistConsents.artistId, artistId)));
}

export async function hasGrantedArtistConnection(userId: string, artistId: string): Promise<boolean> {
  const rows = await consentRowsForArtist(userId, artistId);
  return rows.some((row) => row.status === "granted" && row.consentType === "attendee_offers");
}

export async function getStayConnectedState(
  userId: string,
  artistId: string,
): Promise<StayConnectedState> {
  const rows = await consentRowsForArtist(userId, artistId);

  if (rows.some((row) => row.status === "granted")) {
    return "connected";
  }

  const dismissed = rows.find(
    (row) =>
      row.consentType === "attendee_offers" &&
      row.status === "withdrawn" &&
      row.grantedAt == null,
  );
  if (dismissed) return "dismissed";

  const wasConnected = rows.some((row) => row.status === "withdrawn" && row.grantedAt != null);
  if (wasConnected) return "dismissed";

  return "prompt";
}

export async function grantStayConnected(
  userId: string,
  artistId: string,
  source: ConsentSource = "post_verification_prompt",
): Promise<void> {
  const now = new Date();

  for (const consentType of STAY_CONNECTED_CONSENT_TYPES) {
    const existing = await db
      .select({ id: artistConsents.id })
      .from(artistConsents)
      .where(
        and(
          eq(artistConsents.userId, userId),
          eq(artistConsents.artistId, artistId),
          eq(artistConsents.consentType, consentType),
        ),
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(artistConsents)
        .set({
          status: "granted",
          source,
          grantedAt: now,
          revokedAt: null,
          updatedAt: now,
        })
        .where(eq(artistConsents.id, existing[0].id));
    } else {
      await db.insert(artistConsents).values({
        userId,
        artistId,
        consentType,
        status: "granted",
        source,
        grantedAt: now,
      });
    }
  }
}

/** Records an explicit not-now without granting marketing permission. */
export async function dismissStayConnectedPrompt(
  userId: string,
  artistId: string,
  source: ConsentSource = "post_verification_prompt",
): Promise<void> {
  const now = new Date();
  const existing = await db
    .select({ id: artistConsents.id })
    .from(artistConsents)
    .where(
      and(
        eq(artistConsents.userId, userId),
        eq(artistConsents.artistId, artistId),
        eq(artistConsents.consentType, "attendee_offers"),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(artistConsents)
      .set({
        status: "withdrawn",
        source,
        grantedAt: null,
        revokedAt: now,
        updatedAt: now,
      })
      .where(eq(artistConsents.id, existing[0].id));
    return;
  }

  await db.insert(artistConsents).values({
    userId,
    artistId,
    consentType: "attendee_offers",
    status: "withdrawn",
    source,
    revokedAt: now,
  });
}

export async function withdrawArtistConnection(userId: string, artistId: string): Promise<void> {
  const now = new Date();
  await db
    .update(artistConsents)
    .set({ status: "withdrawn", revokedAt: now, updatedAt: now })
    .where(
      and(
        eq(artistConsents.userId, userId),
        eq(artistConsents.artistId, artistId),
        eq(artistConsents.status, "granted"),
      ),
    );
}

async function connectionContextForArtist(userId: string, artistId: string) {
  const [row] = await db
    .select({
      venueCity: venues.city,
      startsAt: events.startsAt,
      timezone: events.timezone,
    })
    .from(verifiedAttendance)
    .innerJoin(events, eq(events.id, verifiedAttendance.eventId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .where(and(eq(verifiedAttendance.userId, userId), eq(events.artistId, artistId)))
    .orderBy(desc(verifiedAttendance.verifiedAt))
    .limit(1);

  return row ?? null;
}

export async function listFanArtistConnections(userId: string): Promise<ArtistConnectionView[]> {
  const rows = await db
    .select({
      artistId: artistConsents.artistId,
      artistName: artists.name,
      artistSlug: artists.slug,
      consentType: artistConsents.consentType,
      status: artistConsents.status,
      grantedAt: artistConsents.grantedAt,
    })
    .from(artistConsents)
    .innerJoin(artists, eq(artists.id, artistConsents.artistId))
    .where(and(eq(artistConsents.userId, userId), eq(artistConsents.status, "granted")));

  const [prefs] = await db
    .select({ shippingPhone: fanPreferences.shippingPhone })
    .from(fanPreferences)
    .where(eq(fanPreferences.userId, userId))
    .limit(1);

  const hasPhone = Boolean(prefs?.shippingPhone?.trim());

  const byArtist = new Map<string, ArtistConnectionView>();

  for (const row of rows) {
    let entry = byArtist.get(row.artistId);
    if (!entry) {
      entry = {
        artistId: row.artistId,
        artistName: row.artistName,
        artistSlug: row.artistSlug,
        connectedAt: row.grantedAt ?? new Date(0),
        contextCity: null,
        contextStartsAt: null,
        contextTimezone: null,
        emailOptIn: false,
        smsOptIn: false,
        consents: {
          drops: false,
          show_news: false,
          attendee_offers: false,
          anniversary: false,
        },
      };
      byArtist.set(row.artistId, entry);
    }

    if (row.grantedAt && (entry.connectedAt.getTime() === 0 || row.grantedAt < entry.connectedAt)) {
      entry.connectedAt = row.grantedAt;
    }

    if (STAY_CONNECTED_CONSENT_TYPES.includes(row.consentType as (typeof STAY_CONNECTED_CONSENT_TYPES)[number])) {
      entry.consents[row.consentType as (typeof STAY_CONNECTED_CONSENT_TYPES)[number]] = true;
    }
  }

  const connections = [...byArtist.values()].filter((entry) => entry.consents.attendee_offers);

  await Promise.all(
    connections.map(async (entry) => {
      const context = await connectionContextForArtist(userId, entry.artistId);
      if (context) {
        entry.contextCity = context.venueCity;
        entry.contextStartsAt = context.startsAt;
        entry.contextTimezone = context.timezone;
      }
      entry.emailOptIn = entry.consents.show_news;
      entry.smsOptIn = entry.consents.show_news && hasPhone;
    }),
  );

  return connections.sort((a, b) => b.connectedAt.getTime() - a.connectedAt.getTime());
}

/** Future campaign targeting: verified attendance alone does not imply marketing consent. */
export async function fanHasMarketingConsent(
  userId: string,
  artistId: string,
  consentType: ConsentType = "attendee_offers",
): Promise<boolean> {
  const [row] = await db
    .select({ id: artistConsents.id })
    .from(artistConsents)
    .where(
      and(
        eq(artistConsents.userId, userId),
        eq(artistConsents.artistId, artistId),
        eq(artistConsents.consentType, consentType),
        eq(artistConsents.status, "granted"),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function countGrantedConsents(userId: string, artistId: string): Promise<number> {
  const rows = await consentRowsForArtist(userId, artistId);
  return rows.filter((row) => row.status === "granted").length;
}

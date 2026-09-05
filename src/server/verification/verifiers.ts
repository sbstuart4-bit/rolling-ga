import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventVerificationTokens, events, tours, venues, verificationAttempts } from "@/db/schema";
import { isWithinRadius } from "@/lib/geo";
import { verificationWindow } from "@/lib/event-state";
import type { VerificationMethod } from "@/lib/types";
import { demoNow } from "@/server/demo/clock";
import type {
  AttendanceVerifier,
  VerificationOutcome,
  VerificationRequest,
} from "./types";

const MAX_ATTEMPTS_PER_WINDOW = 8;
const ATTEMPT_WINDOW_MS = 10 * 60_000;

async function loadEventContext(eventId: string) {
  const [row] = await db
    .select({
      id: events.id,
      cancelled: events.cancelled,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      doorsAt: events.doorsAt,
      verificationOpensAt: events.verificationOpensAt,
      verificationClosesAt: events.verificationClosesAt,
      postShowWindowMinutes: events.postShowWindowMinutes,
      tourWindowMinutes: tours.postShowWindowMinutes,
      venueLat: venues.lat,
      venueLng: venues.lng,
      geofenceRadiusMeters: venues.geofenceRadiusMeters,
    })
    .from(events)
    .innerJoin(tours, eq(tours.id, events.tourId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .where(eq(events.id, eventId))
    .limit(1);

  return row ?? null;
}

/**
 * Abuse control shared by every verifier. A leaked QR token is only useful if it can be
 * replayed at volume, so both the account and the client are rate-limited.
 */
async function rateLimited(request: VerificationRequest, now: Date): Promise<boolean> {
  const since = new Date(now.getTime() - ATTEMPT_WINDOW_MS);

  const [row] = await db
    .select({ attempts: sql<number>`count(*)` })
    .from(verificationAttempts)
    .where(
      and(
        eq(verificationAttempts.userId, request.userId),
        gte(verificationAttempts.createdAt, since),
      ),
    );

  return Number(row?.attempts ?? 0) >= MAX_ATTEMPTS_PER_WINDOW;
}

function withinVerificationWindow(
  context: NonNullable<Awaited<ReturnType<typeof loadEventContext>>>,
  now: Date,
): boolean {
  const { opensAt, closesAt } = verificationWindow(
    {
      startsAt: context.startsAt,
      endsAt: context.endsAt,
      doorsAt: context.doorsAt,
      postShowWindowMinutes: context.postShowWindowMinutes,
      verificationOpensAt: context.verificationOpensAt,
      verificationClosesAt: context.verificationClosesAt,
    },
    context.tourWindowMinutes,
  );

  return now >= opensAt && now <= closesAt;
}

/**
 * The primary path: the fan scanned the code displayed at the venue, and the token in
 * that code is still the active one for this event.
 */
export const eventQrVerifier: AttendanceVerifier = {
  method: "event_qr",
  label: "Event QR code",
  available: true,

  async verify(request) {
    const now = request.now ?? demoNow();

    if (await rateLimited(request, now)) {
      return {
        ok: false,
        reason: "rate_limited",
        message: "Too many attempts. Wait a few minutes and try again.",
      };
    }

    const context = await loadEventContext(request.eventId);
    if (!context) {
      return { ok: false, reason: "invalid_token", message: "That show could not be found." };
    }
    if (context.cancelled) {
      return { ok: false, reason: "event_cancelled", message: "This show was cancelled." };
    }
    if (!withinVerificationWindow(context, now)) {
      return {
        ok: false,
        reason: "outside_window",
        message: "Verification for this show is closed.",
      };
    }

    if (!request.token) {
      return { ok: false, reason: "invalid_token", message: "No code was scanned." };
    }

    const [token] = await db
      .select({
        id: eventVerificationTokens.id,
        active: eventVerificationTokens.active,
        eventId: eventVerificationTokens.eventId,
        expiresAt: eventVerificationTokens.expiresAt,
      })
      .from(eventVerificationTokens)
      .where(eq(eventVerificationTokens.token, request.token))
      .limit(1);

    if (!token || token.eventId !== request.eventId) {
      return { ok: false, reason: "invalid_token", message: "That code is not valid." };
    }
    if (!token.active) {
      return {
        ok: false,
        reason: "token_rotated",
        message: "That code has been replaced. Scan the one on the screen at the venue.",
      };
    }
    if (token.expiresAt && token.expiresAt < now) {
      return { ok: false, reason: "outside_window", message: "That code has expired." };
    }

    // The QR alone proves the fan reached the venue's own display, so a location check
    // is only applied when coordinates were offered.
    if (request.coordinates) {
      const inside = isWithinRadius(
        request.coordinates,
        { lat: context.venueLat, lng: context.venueLng },
        context.geofenceRadiusMeters,
        request.coordinates.accuracyMeters,
      );
      if (!inside) {
        return {
          ok: false,
          reason: "outside_geofence",
          message: "You appear to be away from the venue.",
        };
      }
    }

    return { ok: true, method: "event_qr", tokenId: token.id };
  },
};

/**
 * The fallback path when there is no code to scan: the fan's device confirms they are
 * physically inside the venue's radius during the verification window.
 */
export const geofenceVerifier: AttendanceVerifier = {
  method: "geofence",
  label: "Location",
  available: true,

  async verify(request) {
    const now = request.now ?? demoNow();

    if (await rateLimited(request, now)) {
      return {
        ok: false,
        reason: "rate_limited",
        message: "Too many attempts. Wait a few minutes and try again.",
      };
    }

    const context = await loadEventContext(request.eventId);
    if (!context) {
      return { ok: false, reason: "invalid_token", message: "That show could not be found." };
    }
    if (context.cancelled) {
      return { ok: false, reason: "event_cancelled", message: "This show was cancelled." };
    }
    if (!withinVerificationWindow(context, now)) {
      return {
        ok: false,
        reason: "outside_window",
        message: "Verification for this show is closed.",
      };
    }
    if (!request.coordinates) {
      return {
        ok: false,
        reason: "location_unavailable",
        message: "Location wasn't shared, so we can't confirm you're here this way.",
      };
    }

    const inside = isWithinRadius(
      request.coordinates,
      { lat: context.venueLat, lng: context.venueLng },
      context.geofenceRadiusMeters,
      request.coordinates.accuracyMeters,
    );

    if (!inside) {
      return {
        ok: false,
        reason: "outside_geofence",
        message: "You appear to be away from the venue.",
      };
    }

    return { ok: true, method: "geofence", tokenId: null };
  },
};

/**
 * Declining location is not a dead end. Venue staff read out a short code derived from
 * the event's active token, which a fan can type in to complete verification.
 */
export const staffOverrideVerifier: AttendanceVerifier = {
  method: "staff_override",
  label: "Code from venue staff",
  available: true,

  async verify(request) {
    const now = request.now ?? demoNow();

    if (await rateLimited(request, now)) {
      return {
        ok: false,
        reason: "rate_limited",
        message: "Too many attempts. Ask staff to try again in a few minutes.",
      };
    }

    const context = await loadEventContext(request.eventId);
    if (!context) {
      return { ok: false, reason: "invalid_code", message: "That show could not be found." };
    }
    if (!withinVerificationWindow(context, now)) {
      return {
        ok: false,
        reason: "outside_window",
        message: "Verification for this show is closed.",
      };
    }

    const [token] = await db
      .select({ id: eventVerificationTokens.id, token: eventVerificationTokens.token })
      .from(eventVerificationTokens)
      .where(
        and(
          eq(eventVerificationTokens.eventId, request.eventId),
          eq(eventVerificationTokens.active, true),
        ),
      )
      .limit(1);

    if (!token) {
      return { ok: false, reason: "invalid_code", message: "This show has no active code." };
    }

    const expected = staffCodeForToken(token.token);
    const provided = (request.staffCode ?? "").replace(/[\s-]/g, "").toUpperCase();

    if (provided !== expected) {
      return { ok: false, reason: "invalid_code", message: "That code isn't right." };
    }

    return { ok: true, method: "staff_override", tokenId: token.id };
  },
};

/** The six-character code venue staff read out, derived from the event's active token. */
export function staffCodeForToken(token: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let hash = 2166136261;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let code = "";
  let value = hash >>> 0;
  for (let i = 0; i < 6; i++) {
    code += alphabet[value % alphabet.length];
    value = Math.floor(value / alphabet.length) + 7919;
  }
  return code;
}

/**
 * Integrations that are architected but not built.
 *
 * Each one is a real registered verifier that returns `provider_unavailable`, so the
 * Studio can show exactly what is and is not wired up, and no code path anywhere
 * pretends a ticketing or hardware check happened when it did not.
 */
function unavailableVerifier(
  method: VerificationMethod,
  label: string,
  unavailableReason: string,
): AttendanceVerifier {
  return {
    method,
    label,
    available: false,
    unavailableReason,
    async verify(): Promise<VerificationOutcome> {
      return {
        ok: false,
        reason: "provider_unavailable",
        message: `${label} verification is not configured in this environment.`,
      };
    },
  };
}

export const ticketBarcodeVerifier = unavailableVerifier(
  "ticket_barcode",
  "Ticket barcode",
  "Needs a ticketing partner to validate barcodes against their scan data.",
);

export const ticketmasterVerifier = unavailableVerifier(
  "ticketmaster",
  "Ticketmaster",
  "Needs Ticketmaster API credentials and an approved integration.",
);

export const axsVerifier = unavailableVerifier(
  "axs",
  "AXS",
  "Needs AXS API credentials and an approved integration.",
);

export const nfcVerifier = unavailableVerifier(
  "nfc",
  "NFC tap",
  "Needs venue NFC hardware and a tag provisioning service.",
);

export const walletVerifier = unavailableVerifier(
  "wallet",
  "Mobile wallet pass",
  "Needs an Apple Wallet / Google Wallet pass certificate.",
);

export const ALL_VERIFIERS: AttendanceVerifier[] = [
  eventQrVerifier,
  geofenceVerifier,
  staffOverrideVerifier,
  ticketBarcodeVerifier,
  ticketmasterVerifier,
  axsVerifier,
  nfcVerifier,
  walletVerifier,
];

export function verifierFor(method: VerificationMethod): AttendanceVerifier {
  const found = ALL_VERIFIERS.find((v) => v.method === method);
  if (!found) throw new Error(`No verifier registered for method: ${method}`);
  return found;
}

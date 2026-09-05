import type { GeoPoint } from "@/lib/types";
import type { VerificationMethod } from "@/lib/types";

export type VerificationFailureReason =
  | "invalid_token"
  | "token_rotated"
  | "outside_window"
  | "outside_geofence"
  | "location_unavailable"
  | "rate_limited"
  | "already_verified"
  | "event_cancelled"
  | "provider_unavailable"
  | "invalid_code";

export interface VerificationRequest {
  userId: string;
  eventId: string;
  /** The token from the scanned QR, when the method is `event_qr`. */
  token?: string;
  /**
   * Used once for the radius check and then discarded. Coordinates are never written
   * to the database — only the pass/fail outcome, the method and the timestamp persist.
   */
  coordinates?: (GeoPoint & { accuracyMeters?: number }) | null;
  /** A code read out by venue staff when a fan declines or cannot share location. */
  staffCode?: string;
  clientHash?: string | null;
  now?: Date;
}

export type VerificationOutcome =
  | { ok: true; method: VerificationMethod; tokenId: string | null }
  | { ok: false; reason: VerificationFailureReason; message: string };

/**
 * One way of proving somebody was at a show.
 *
 * Verification is modelled as a set of interchangeable verifiers so ticketing and
 * hardware integrations can be added later without touching the credential, the
 * eligibility rules, or anything downstream of `verified_attendance`.
 */
export interface AttendanceVerifier {
  readonly method: VerificationMethod;
  readonly label: string;
  /**
   * `false` for the integrations that are not built. Those verifiers report a clear
   * "not configured" outcome rather than approximating a result.
   */
  readonly available: boolean;
  /** Shown in the Studio and in fan-facing fallbacks to explain the state. */
  readonly unavailableReason?: string;
  verify(request: VerificationRequest): Promise<VerificationOutcome>;
}

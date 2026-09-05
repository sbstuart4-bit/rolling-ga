import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { verifiedAttendance, verificationAttempts } from "@/db/schema";
import type { VerificationMethod } from "@/lib/types";
import { demoNow } from "@/server/demo/clock";
import type { VerificationRequest } from "./types";
import { verifierFor } from "./verifiers";

export interface VerificationResult {
  ok: boolean;
  /** True when the fan already held a credential for this show. */
  alreadyVerified: boolean;
  method?: VerificationMethod;
  reason?: string;
  message?: string;
}

export async function hasVerifiedAttendance(userId: string, eventId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: verifiedAttendance.id })
    .from(verifiedAttendance)
    .where(and(eq(verifiedAttendance.userId, userId), eq(verifiedAttendance.eventId, eventId)))
    .limit(1);

  return !!row;
}

export async function getVerifiedAttendance(userId: string, eventId: string) {
  const [row] = await db
    .select()
    .from(verifiedAttendance)
    .where(and(eq(verifiedAttendance.userId, userId), eq(verifiedAttendance.eventId, eventId)))
    .limit(1);

  return row ?? null;
}

/**
 * Runs one verifier and, on success, writes the permanent credential.
 *
 * Every attempt is logged whether it succeeds or not, which is what makes the rate
 * limiting in the verifiers meaningful. Duplicates rely on the unique index rather than
 * a read-then-write, so two simultaneous scans still produce exactly one credential.
 */
export async function verifyAttendance(
  method: VerificationMethod,
  request: VerificationRequest,
): Promise<VerificationResult> {
  const existing = await getVerifiedAttendance(request.userId, request.eventId);
  if (existing) {
    return { ok: true, alreadyVerified: true, method: existing.method };
  }

  const verifier = verifierFor(method);
  const outcome = await verifier.verify(request);

  await db.insert(verificationAttempts).values({
    eventId: request.eventId,
    userId: request.userId,
    method,
    succeeded: outcome.ok,
    failureReason: outcome.ok ? null : outcome.reason,
    clientHash: request.clientHash ?? null,
  });

  if (!outcome.ok) {
    return { ok: false, alreadyVerified: false, reason: outcome.reason, message: outcome.message };
  }

  // The unique index on (user_id, event_id) is the guarantee. A concurrent scan that
  // loses the race is still a success — the credential already exists.
  const [inserted] = await db
    .insert(verifiedAttendance)
    .values({
      userId: request.userId,
      eventId: request.eventId,
      method: outcome.method,
      tokenId: outcome.tokenId,
      verifiedAt: request.now ?? demoNow(),
    })
    .onConflictDoNothing({
      target: [verifiedAttendance.userId, verifiedAttendance.eventId],
    })
    .returning({ method: verifiedAttendance.method });

  if (!inserted) {
    return { ok: true, alreadyVerified: true, method: outcome.method };
  }

  return { ok: true, alreadyVerified: false, method: inserted.method };
}

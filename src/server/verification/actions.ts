"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hashClientIdentifier } from "@/lib/token";
import { assertUser } from "@/server/auth/guards";
import { getAuthContext } from "@/server/auth/session";
import { getEventById } from "@/server/events/queries";
import { verifyAttendance } from "./service";

export interface VerifyState {
  error?: string;
  reason?: string;
}

const coordinateSchema = z.object({
  eventId: z.string().min(1),
  token: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  accuracy: z.coerce.number().min(0).max(100_000).optional(),
});

async function clientHash(): Promise<string | null> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded ?? list.get("x-real-ip");
  return address ? hashClientIdentifier(address) : null;
}

/**
 * Verifies attendance using the fan's location, optionally alongside a scanned token.
 *
 * The coordinates arrive from the browser, are used once for the radius check inside the
 * verifier, and are never persisted.
 */
export async function verifyWithLocationAction(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  const parsed = coordinateSchema.safeParse({
    eventId: formData.get("eventId"),
    token: formData.get("token") ?? undefined,
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    accuracy: formData.get("accuracy") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "We couldn't read your location. Try again.", reason: "location_unavailable" };
  }

  const event = await getEventById(parsed.data.eventId);
  if (!event) return { error: "That show could not be found.", reason: "invalid_token" };

  // A scanned token is the stronger claim, so prefer it and fall back to geofence alone.
  const method = parsed.data.token ? "event_qr" : "geofence";

  const result = await verifyAttendance(method, {
    userId: ctx.userId,
    eventId: parsed.data.eventId,
    token: parsed.data.token,
    coordinates: {
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      accuracyMeters: parsed.data.accuracy,
    },
    clientHash: await clientHash(),
  });

  if (!result.ok) {
    return { error: result.message ?? "We couldn't verify you at this show.", reason: result.reason };
  }

  redirect(`/event/${event.slug}/credential?just_verified=1`);
}

const staffCodeSchema = z.object({
  eventId: z.string().min(1),
  code: z.string().trim().min(4).max(16),
});

/** The path for a fan who declines location: a code read out by venue staff. */
export async function verifyWithStaffCodeAction(
  _prev: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  const parsed = staffCodeSchema.safeParse({
    eventId: formData.get("eventId"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { error: "Enter the six-character code from venue staff.", reason: "invalid_code" };
  }

  const event = await getEventById(parsed.data.eventId);
  if (!event) return { error: "That show could not be found.", reason: "invalid_code" };

  const result = await verifyAttendance("staff_override", {
    userId: ctx.userId,
    eventId: parsed.data.eventId,
    staffCode: parsed.data.code,
    clientHash: await clientHash(),
  });

  if (!result.ok) {
    return { error: result.message ?? "That code isn't right.", reason: result.reason };
  }

  redirect(`/event/${event.slug}/credential?just_verified=1`);
}

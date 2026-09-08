"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { drops, dropProducts, events, products } from "@/db/schema";
import { assertArtistPublish } from "@/server/auth/guards";
import { getAuthContext } from "@/server/auth/session";
import { demoNow } from "@/server/demo/clock";
import { getEventById } from "@/server/events/queries";
import {
  buildActivationAudiencePreview,
  createShowCohortAudienceSegment,
  resolveCohortMemberUserIds,
} from "@/server/activation/queries";
import { isActivatableCohortStage } from "@/lib/activation/audience";
import type { CohortFunnelStage } from "@/lib/relationship-intelligence/types";

/** The drop's configuration. Whether to publish it is a separate decision. */
const flashDropSchema = z.object({
  artistId: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  eventId: z.string().min(1),
  durationMinutes: z.coerce.number().int().min(5).max(2880),
  productIds: z.array(z.string().min(1)).min(1).max(20),
  cohortStage: z.string().optional(),
});

/**
 * Exactly one value authorizes a write. An absent field means "preview", and anything
 * unrecognised is refused rather than coerced, so a malformed submission can never be
 * read as consent to publish.
 */
const confirmSchema = z.enum(["true", "false"]);

export interface FlashDropState {
  error?: string;
  preview?: {
    title: string;
    description?: string;
    eventId: string;
    durationMinutes: number;
    productIds: string[];
    productCount: number;
    productNames: string[];
    cohortStage?: CohortFunnelStage;
    audienceLabel?: string;
    eligibleFanCount?: number;
    originShowLabel?: string;
    startsAtIso?: string;
    endsAtIso?: string;
  };
}

/**
 * Flash drop creation, in two passes.
 *
 * The first submission validates everything and returns a preview without writing. The
 * second carries the reviewed configuration back with `confirm=true` and publishes it.
 * Both passes run the identical authorization and ownership checks — the preview is a
 * courtesy to the artist, never a substitute for validating the confirming request.
 */
export async function createFlashDropAction(
  _prev: FlashDropState,
  formData: FormData,
): Promise<FlashDropState> {
  const ctx = await getAuthContext();

  const artistId = String(formData.get("artistId") ?? "");
  assertArtistPublish(ctx, artistId);

  const rawConfirm = formData.get("confirm");
  const confirm = confirmSchema.safeParse(rawConfirm === null ? "false" : String(rawConfirm));
  if (!confirm.success) {
    return { error: "That confirmation wasn't recognised. Please review the drop and try again." };
  }
  const publishing = confirm.data === "true";

  // Duplicate selections collapse to one entry, matching the unique index on
  // (drop_id, product_id).
  const productIds = [...new Set(formData.getAll("productIds").map(String))];
  const description = String(formData.get("description") ?? "").trim();

  const parsed = flashDropSchema.safeParse({
    artistId,
    title: formData.get("title"),
    description: description.length > 0 ? description : undefined,
    eventId: formData.get("eventId"),
    durationMinutes: formData.get("durationMinutes") ?? 60,
    productIds,
    cohortStage: String(formData.get("cohortStage") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Please check all required fields." };
  }

  // The browser chooses the show and the products, so both are re-resolved against the
  // acting artist before anything is written. Cross-artist ids are rejected outright
  // rather than filtered out, so a bad selection never silently publishes a partial drop.
  const [event] = await db
    .select({ id: events.id, artistId: events.artistId })
    .from(events)
    .where(eq(events.id, parsed.data.eventId))
    .limit(1);

  if (!event || event.artistId !== parsed.data.artistId) {
    return { error: "That show isn't on your account." };
  }

  const ownedProducts = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(
      and(
        inArray(products.id, parsed.data.productIds),
        eq(products.artistId, parsed.data.artistId),
        eq(products.active, true),
      ),
    );

  if (ownedProducts.length !== parsed.data.productIds.length) {
    return { error: "One or more of those products isn't on your account." };
  }

  const eventDetails = await getEventById(parsed.data.eventId);
  const cohortStage =
    parsed.data.cohortStage && isActivatableCohortStage(parsed.data.cohortStage)
      ? parsed.data.cohortStage
      : undefined;

  const audiencePreview = cohortStage
    ? await buildActivationAudiencePreview(parsed.data.artistId, parsed.data.eventId, cohortStage)
    : null;

  if (cohortStage && !audiencePreview) {
    return { error: "That audience couldn't be resolved for this show." };
  }

  if (cohortStage && audiencePreview && audiencePreview.eligibleFanCount === 0) {
    return { error: "No fans match this audience stage for the selected show." };
  }

  const now = demoNow();
  const endsAt = new Date(now.getTime() + parsed.data.durationMinutes * 60_000);
  const productNames = parsed.data.productIds.map(
    (id) => ownedProducts.find((p) => p.id === id)?.name ?? "Product",
  );

  // Validated, but not confirmed: hand the configuration back for review. Nothing is
  // written, no inventory moves, no drop exists yet.
  if (!publishing) {
    return {
      preview: {
        title: parsed.data.title,
        description: parsed.data.description,
        eventId: parsed.data.eventId,
        durationMinutes: parsed.data.durationMinutes,
        productIds: parsed.data.productIds,
        productCount: parsed.data.productIds.length,
        productNames,
        cohortStage,
        audienceLabel: audiencePreview?.audienceLabel,
        eligibleFanCount: audiencePreview?.eligibleFanCount,
        originShowLabel: eventDetails
          ? `${eventDetails.tourName ?? "Show"} · ${eventDetails.venueCity}`
          : undefined,
        startsAtIso: now.toISOString(),
        endsAtIso: endsAt.toISOString(),
      },
    };
  }

  // Confirmed — publish
  let audienceSegmentId: string | null = null;
  if (cohortStage && audiencePreview) {
    const snapshotUserIds = await resolveCohortMemberUserIds(
      parsed.data.artistId,
      parsed.data.eventId,
      cohortStage,
    );
    audienceSegmentId = await createShowCohortAudienceSegment({
      artistId: parsed.data.artistId,
      originEventId: parsed.data.eventId,
      cohortStage,
      snapshotUserIds,
      venueCity: audiencePreview.venueCity,
    });
  }

  const publishNow = demoNow();
  const publishEndsAt = new Date(publishNow.getTime() + parsed.data.durationMinutes * 60_000);

  const [drop] = await db
    .insert(drops)
    .values({
      artistId: parsed.data.artistId,
      eventId: parsed.data.eventId,
      slug: `flash-${Date.now()}`,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      startsAt: publishNow,
      endsAt: publishEndsAt,
      status: "live",
      exclusivityType: "flash",
      displayPriority: 100,
      notificationsEnabled: true,
      publishedAt: publishNow,
      audienceSegmentId,
    })
    .returning({ id: drops.id });

  await db.insert(dropProducts).values(
    parsed.data.productIds.map((productId, i) => ({
      dropId: drop.id,
      productId,
      displayOrder: i,
    })),
  );

  revalidatePath("/studio/drops");
  revalidatePath("/drops");
  revalidatePath(`/studio/drops/${drop.id}`);
  revalidatePath(`/studio/fans/cohort/${parsed.data.eventId}`);
  redirect(`/studio/drops/${drop.id}`);
}

const liveDropSchema = z.object({
  artistId: z.string().min(1),
  eventId: z.string().min(1),
  productId: z.string().min(1),
  dropPriceCents: z.coerce.number().int().min(0),
  quantityLimit: z.coerce.number().int().min(1).optional(),
  startMode: z.enum(["now", "scheduled"]),
  scheduledStartsAt: z.string().optional(),
  durationMode: z.enum(["minutes", "until_post_show_close"]),
  durationMinutes: z.coerce.number().int().min(5).max(1440).optional(),
  exclusivityType: z.enum(["flash", "encore"]).default("encore"),
});

export interface LiveDropState {
  error?: string;
  preview?: {
    eventId: string;
    productId: string;
    productName: string;
    dropPriceCents: number;
    quantityLimit: number | null;
    eligibleFanCount: number;
    startsAtIso: string;
    endsAtIso: string;
    durationLabel: string;
    audienceLabel: string;
    exclusivityType: "flash" | "encore";
  };
}

/**
 * Live Command Center drop workflow — preview then explicit LAUNCH DROP confirmation.
 * Uses the same drops / drop_products records fans see in the event shop.
 */
export async function createLiveDropAction(
  _prev: LiveDropState,
  formData: FormData,
): Promise<LiveDropState> {
  const ctx = await getAuthContext();
  const artistId = String(formData.get("artistId") ?? "");
  assertArtistPublish(ctx, artistId);

  const rawConfirm = formData.get("confirm");
  const confirm = confirmSchema.safeParse(rawConfirm === null ? "false" : String(rawConfirm));
  if (!confirm.success) {
    return { error: "That confirmation wasn't recognised. Please review the drop and try again." };
  }
  const publishing = confirm.data === "true";

  const parsed = liveDropSchema.safeParse({
    artistId,
    eventId: formData.get("eventId"),
    productId: formData.get("productId"),
    dropPriceCents: formData.get("dropPriceCents"),
    quantityLimit: formData.get("quantityLimit") || undefined,
    startMode: formData.get("startMode") ?? "now",
    scheduledStartsAt: String(formData.get("scheduledStartsAt") ?? "").trim() || undefined,
    durationMode: formData.get("durationMode") ?? "minutes",
    durationMinutes: formData.get("durationMinutes") || undefined,
    exclusivityType: formData.get("exclusivityType") ?? "encore",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check all required fields." };
  }

  const [event] = await db
    .select({
      id: events.id,
      artistId: events.artistId,
      endsAt: events.endsAt,
      postShowWindowMinutes: events.postShowWindowMinutes,
      tourId: events.tourId,
      slug: events.slug,
    })
    .from(events)
    .where(eq(events.id, parsed.data.eventId))
    .limit(1);

  if (!event || event.artistId !== parsed.data.artistId) {
    return { error: "That show isn't on your account." };
  }

  const eventDetails = await getEventById(parsed.data.eventId);

  const [product] = await db
    .select({ id: products.id, name: products.name, artistId: products.artistId })
    .from(products)
    .where(
      and(
        eq(products.id, parsed.data.productId),
        eq(products.artistId, parsed.data.artistId),
        eq(products.active, true),
      ),
    )
    .limit(1);

  if (!product) {
    return { error: "That product isn't on your account." };
  }

  const { countEligibleVerifiedAttendees, computeDropEndTime } = await import(
    "@/server/studio/live"
  );
  const eligibleFanCount = await countEligibleVerifiedAttendees(parsed.data.eventId, artistId);

  const now = demoNow();
  const startsAt =
    parsed.data.startMode === "scheduled" && parsed.data.scheduledStartsAt
      ? new Date(parsed.data.scheduledStartsAt)
      : now;

  if (Number.isNaN(startsAt.getTime())) {
    return { error: "Choose a valid scheduled start time." };
  }

  const endsAt = computeDropEndTime({
    startsAt,
    durationMode: parsed.data.durationMode,
    durationMinutes: parsed.data.durationMinutes,
    event: {
      endsAt: event.endsAt,
      postShowWindowMinutes: event.postShowWindowMinutes,
    },
  });

  const durationLabel =
    parsed.data.durationMode === "until_post_show_close"
      ? "Until post-show close"
      : `${parsed.data.durationMinutes ?? 45} minutes`;

  if (!publishing) {
    return {
      preview: {
        eventId: parsed.data.eventId,
        productId: parsed.data.productId,
        productName: product.name,
        dropPriceCents: parsed.data.dropPriceCents,
        quantityLimit: parsed.data.quantityLimit ?? null,
        eligibleFanCount,
        startsAtIso: startsAt.toISOString(),
        endsAtIso: endsAt.toISOString(),
        durationLabel,
        audienceLabel: `Verified ${eventDetails?.venueCity ?? "show"} attendees`,
        exclusivityType: parsed.data.exclusivityType,
      },
    };
  }

  const status = startsAt.getTime() <= now.getTime() ? "live" : "scheduled";
  const slugBase = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);

  const [drop] = await db
    .insert(drops)
    .values({
      artistId: parsed.data.artistId,
      eventId: parsed.data.eventId,
      tourId: event.tourId,
      slug: `${slugBase}-${Date.now()}`,
      title: product.name,
      description: `${durationLabel} · verified attendees only`,
      startsAt,
      endsAt,
      status,
      exclusivityType: parsed.data.exclusivityType,
      quantityLimit: parsed.data.quantityLimit ?? null,
      displayPriority: 100,
      notificationsEnabled: true,
      publishedAt: now,
    })
    .returning({ id: drops.id });

  await db.insert(dropProducts).values({
    dropId: drop.id,
    productId: parsed.data.productId,
    dropPriceCents: parsed.data.dropPriceCents,
    displayOrder: 0,
  });

  revalidatePath(`/studio/live/${parsed.data.eventId}`);
  revalidatePath("/studio");
  revalidatePath("/studio/drops");
  revalidatePath(`/event/${eventDetails?.slug ?? event.slug}`);
  revalidatePath("/drops");

  redirect(`/studio/live/${parsed.data.eventId}?launched=${drop.id}`);
}

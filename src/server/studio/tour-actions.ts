"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { eventThemes, events, tours } from "@/db/schema";
import { SHIPPING_STRATEGIES } from "@/lib/types";
import { assertArtistAccess } from "@/server/auth/guards";
import { getAuthContext } from "@/server/auth/session";
import { requireTourForArtist } from "@/server/studio/tour-queries";

export interface TourActionState {
  ok?: boolean;
  error?: string;
}

const optionalText = z.string().trim().optional();

const tourDefaultsSchema = z.object({
  tourId: z.string().min(1),
  artistId: z.string().min(1),
  name: z.string().min(1).max(120),
  showMessaging: optionalText,
  artworkUrl: optionalText,
  logoUrl: optionalText,
  heroImageUrl: optionalText,
  accent: optionalText,
  background: optionalText,
  postShowWindowMinutes: z.coerce.number().int().min(0).max(10_080),
  shippingStrategy: z.enum(SHIPPING_STRATEGIES),
});

const eventOverrideSchema = z.object({
  tourId: z.string().min(1),
  eventId: z.string().min(1),
  artistId: z.string().min(1),
  localMessage: optionalText,
  postShowWindowMinutes: z.coerce.number().int().min(0).max(10_080).optional(),
  cityArtworkUrl: optionalText,
  heroImageUrl: optionalText,
  showMessaging: optionalText,
  accent: optionalText,
});

const duplicateSchema = z.object({
  artistId: z.string().min(1),
  tourId: z.string().min(1),
  sourceEventId: z.string().min(1),
  targetEventId: z.string().min(1),
});

const createTourSchema = z.object({
  artistId: z.string().min(1),
  name: z.string().min(1).max(120),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

const createEventSchema = z.object({
  artistId: z.string().min(1),
  tourId: z.string().min(1),
  venueId: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  title: optionalText,
});

function revalidateTourPaths(tourId: string, eventId?: string) {
  revalidatePath("/studio/tour");
  revalidatePath(`/studio/tour/${tourId}`);
  revalidatePath(`/studio/tour/${tourId}/defaults`);
  if (eventId) {
    revalidatePath(`/studio/tour/${tourId}/events/${eventId}`);
    revalidatePath(`/event/${eventId}`);
  }
}

export async function updateTourDefaultsAction(
  _prev: TourActionState,
  formData: FormData,
): Promise<TourActionState> {
  const ctx = await getAuthContext();
  const parsed = tourDefaultsSchema.safeParse({
    tourId: formData.get("tourId"),
    artistId: formData.get("artistId"),
    name: formData.get("name"),
    showMessaging: formData.get("showMessaging") ?? undefined,
    artworkUrl: formData.get("artworkUrl") ?? undefined,
    logoUrl: formData.get("logoUrl") ?? undefined,
    heroImageUrl: formData.get("heroImageUrl") ?? undefined,
    accent: formData.get("accent") ?? undefined,
    background: formData.get("background") ?? undefined,
    postShowWindowMinutes: formData.get("postShowWindowMinutes"),
    shippingStrategy: formData.get("shippingStrategy"),
  });

  if (!parsed.success) return { error: "Check tour defaults and try again." };

  assertArtistAccess(ctx, parsed.data.artistId);
  const tour = await requireTourForArtist(parsed.data.tourId, parsed.data.artistId);
  if (!tour) return { error: "Tour not found." };

  await db
    .update(tours)
    .set({
      name: parsed.data.name,
      showMessaging: parsed.data.showMessaging || null,
      artworkUrl: parsed.data.artworkUrl || null,
      logoUrl: parsed.data.logoUrl || null,
      heroImageUrl: parsed.data.heroImageUrl || null,
      accent: parsed.data.accent || null,
      background: parsed.data.background || null,
      postShowWindowMinutes: parsed.data.postShowWindowMinutes,
      shippingStrategy: parsed.data.shippingStrategy,
      updatedAt: new Date(),
    })
    .where(eq(tours.id, parsed.data.tourId));

  revalidateTourPaths(parsed.data.tourId);
  return { ok: true };
}

export async function updateEventOverrideAction(
  _prev: TourActionState,
  formData: FormData,
): Promise<TourActionState> {
  const ctx = await getAuthContext();
  const parsed = eventOverrideSchema.safeParse({
    tourId: formData.get("tourId"),
    eventId: formData.get("eventId"),
    artistId: formData.get("artistId"),
    localMessage: formData.get("localMessage") ?? undefined,
    postShowWindowMinutes: formData.get("postShowWindowMinutes") || undefined,
    cityArtworkUrl: formData.get("cityArtworkUrl") ?? undefined,
    heroImageUrl: formData.get("heroImageUrl") ?? undefined,
    showMessaging: formData.get("showMessaging") ?? undefined,
    accent: formData.get("accent") ?? undefined,
  });

  if (!parsed.success) return { error: "Check show overrides and try again." };

  assertArtistAccess(ctx, parsed.data.artistId);

  const [event] = await db
    .select({ id: events.id, artistId: events.artistId, slug: events.slug })
    .from(events)
    .where(eq(events.id, parsed.data.eventId))
    .limit(1);

  if (!event || event.artistId !== parsed.data.artistId) {
    return { error: "That show isn't on your account." };
  }

  const tour = await requireTourForArtist(parsed.data.tourId, parsed.data.artistId);
  if (!tour) return { error: "Tour not found." };

  await db
    .update(events)
    .set({
      localMessage: parsed.data.localMessage || null,
      postShowWindowMinutes:
        parsed.data.postShowWindowMinutes === undefined
          ? null
          : parsed.data.postShowWindowMinutes,
      updatedAt: new Date(),
    })
    .where(eq(events.id, parsed.data.eventId));

  const themeValues = {
    cityArtworkUrl: parsed.data.cityArtworkUrl || null,
    heroImageUrl: parsed.data.heroImageUrl || null,
    showMessaging: parsed.data.showMessaging || null,
    accent: parsed.data.accent || null,
    updatedAt: new Date(),
  };

  const hasThemeOverride = Object.entries(themeValues).some(
    ([key, value]) => key !== "updatedAt" && value != null && value !== "",
  );

  if (hasThemeOverride) {
    await db
      .insert(eventThemes)
      .values({ eventId: parsed.data.eventId, ...themeValues })
      .onConflictDoUpdate({
        target: eventThemes.eventId,
        set: themeValues,
      });
  }

  revalidateTourPaths(parsed.data.tourId, parsed.data.eventId);
  revalidatePath(`/event/${event.slug}`);
  return { ok: true };
}

export async function resetEventToTourDefaultsAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  const tourId = String(formData.get("tourId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const artistId = String(formData.get("artistId") ?? "");

  assertArtistAccess(ctx, artistId);

  const [event] = await db
    .select({ id: events.id, artistId: events.artistId, slug: events.slug })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.tourId, tourId)))
    .limit(1);

  if (!event || event.artistId !== artistId) return;

  await db.delete(eventThemes).where(eq(eventThemes.eventId, eventId));
  await db
    .update(events)
    .set({ localMessage: null, postShowWindowMinutes: null, updatedAt: new Date() })
    .where(eq(events.id, eventId));

  revalidateTourPaths(tourId, eventId);
  revalidatePath(`/event/${event.slug}`);
}

/** Copies theme + show messaging config only — never orders, attendance, or analytics. */
export async function duplicateEventConfigAction(
  _prev: TourActionState,
  formData: FormData,
): Promise<TourActionState> {
  const ctx = await getAuthContext();
  const parsed = duplicateSchema.safeParse({
    artistId: formData.get("artistId"),
    tourId: formData.get("tourId"),
    sourceEventId: formData.get("sourceEventId"),
    targetEventId: formData.get("targetEventId"),
  });

  if (!parsed.success) return { error: "Invalid duplication request." };
  if (parsed.data.sourceEventId === parsed.data.targetEventId) {
    return { error: "Choose a different target show." };
  }

  assertArtistAccess(ctx, parsed.data.artistId);
  const tour = await requireTourForArtist(parsed.data.tourId, parsed.data.artistId);
  if (!tour) return { error: "Tour not found." };

  const tourEvents = await db
    .select({ id: events.id, artistId: events.artistId, slug: events.slug })
    .from(events)
    .where(eq(events.tourId, parsed.data.tourId));

  const source = tourEvents.find((row) => row.id === parsed.data.sourceEventId);
  const target = tourEvents.find((row) => row.id === parsed.data.targetEventId);

  if (!source || !target || source.artistId !== parsed.data.artistId) {
    return { error: "Both shows must belong to this tour." };
  }

  const [sourceEvent] = await db.select().from(events).where(eq(events.id, source.id)).limit(1);
  const [sourceTheme] = await db
    .select()
    .from(eventThemes)
    .where(eq(eventThemes.eventId, source.id))
    .limit(1);

  if (!sourceEvent) return { error: "Source show not found." };

  await db
    .update(events)
    .set({
      localMessage: sourceEvent.localMessage,
      postShowWindowMinutes: sourceEvent.postShowWindowMinutes,
      updatedAt: new Date(),
    })
    .where(eq(events.id, target.id));

  if (sourceTheme) {
    const { eventId: _omit, ...themeCopy } = sourceTheme;
    await db
      .insert(eventThemes)
      .values({ eventId: target.id, ...themeCopy, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: eventThemes.eventId,
        set: { ...themeCopy, updatedAt: new Date() },
      });
  } else {
    await db.delete(eventThemes).where(eq(eventThemes.eventId, target.id));
  }

  revalidateTourPaths(parsed.data.tourId, target.id);
  revalidatePath(`/event/${target.slug}`);
  return { ok: true };
}

export async function createTourAction(
  _prev: TourActionState,
  formData: FormData,
): Promise<TourActionState> {
  const ctx = await getAuthContext();
  const parsed = createTourSchema.safeParse({
    artistId: formData.get("artistId"),
    name: formData.get("name"),
    year: formData.get("year") || undefined,
  });

  if (!parsed.success) return { error: "Tour name is required." };

  assertArtistAccess(ctx, parsed.data.artistId);

  const slug = parsed.data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 48);

  const [tour] = await db
    .insert(tours)
    .values({
      artistId: parsed.data.artistId,
      slug: `${slug}-${Date.now()}`,
      name: parsed.data.name,
      year: parsed.data.year ?? null,
    })
    .returning({ id: tours.id });

  redirect(`/studio/tour/${tour.id}`);
}

export async function createEventAction(
  _prev: TourActionState,
  formData: FormData,
): Promise<TourActionState> {
  const ctx = await getAuthContext();
  const parsed = createEventSchema.safeParse({
    artistId: formData.get("artistId"),
    tourId: formData.get("tourId"),
    venueId: formData.get("venueId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    title: formData.get("title") ?? undefined,
  });

  if (!parsed.success) return { error: "Complete all show fields." };

  assertArtistAccess(ctx, parsed.data.artistId);
  const tour = await requireTourForArtist(parsed.data.tourId, parsed.data.artistId);
  if (!tour) return { error: "Tour not found." };

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { error: "Invalid show times." };
  }

  const slug = `${tour.slug}-${startsAt.getTime()}`;

  const [event] = await db
    .insert(events)
    .values({
      artistId: parsed.data.artistId,
      tourId: parsed.data.tourId,
      venueId: parsed.data.venueId,
      slug,
      title: parsed.data.title || null,
      startsAt,
      endsAt,
      timezone: "America/Detroit",
    })
    .returning({ id: events.id });

  revalidateTourPaths(parsed.data.tourId, event.id);
  redirect(`/studio/tour/${parsed.data.tourId}/events/${event.id}`);
}

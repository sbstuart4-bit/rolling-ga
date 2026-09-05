import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { drops, dropProducts, events, products } from "@/db/schema";
import {
  listAttendedArtistIds,
  listAttendedEventIds,
  listAttendedTourIds,
} from "@/server/attendance/queries";
import {
  availableUnits,
  isEligibleForProduct,
  listVariantsWithInventory,
} from "@/server/catalog/queries";
import { demoNow } from "@/server/demo/clock";
import { resolveProductImage } from "@/lib/demo-product-images";
import { assertEventAttendeeStoreOpen } from "@/server/events/commerce-window";
import { getCartWithItems } from "./queries";
import {
  getCommerceEventContext,
  primaryCartEventId,
  type CommerceEventContext,
} from "./attribution";

/**
 * Server-side resolution and pricing for cart lines.
 *
 * Everything a browser can send about a purchase — product, variant, drop, show, price
 * — is treated as a claim to be checked rather than a fact. Both add-to-cart and
 * checkout run through the same resolver so a line cannot be priced one way going into
 * the cart and another way coming out of it.
 *
 * Functions here take an explicit `userId` and `now` instead of reading the session, so
 * the rules can be exercised directly without a request context.
 */

export type LineRejection =
  | "product_not_found"
  | "product_mismatch"
  | "variant_not_found"
  | "variant_required"
  | "event_not_found"
  | "event_mismatch"
  | "drop_not_found"
  | "drop_mismatch"
  | "drop_closed"
  | "post_show_closed"
  | "not_eligible"
  | "out_of_stock"
  | "unsupported_line";

export interface ResolvedLine {
  productId: string;
  variantId: string;
  dropId: string | null;
  artistId: string;
  /** The show the product itself belongs to, when it is show-specific. */
  productEventId: string | null;
  name: string;
  size: string | null;
  imageUrl: string | null;
  unitPriceCents: number;
  unitCostCents: number | null;
  quantity: number;
}

export type LineResult =
  | { ok: true; line: ResolvedLine }
  | { ok: false; reason: LineRejection; message: string };

export interface AttendanceFacts {
  attendedEventIds: string[];
  attendedTourIds: string[];
  attendedArtistIds: string[];
}

export async function loadAttendanceFacts(userId: string): Promise<AttendanceFacts> {
  const [attendedEventIds, attendedTourIds, attendedArtistIds] = await Promise.all([
    listAttendedEventIds(userId),
    listAttendedTourIds(userId),
    listAttendedArtistIds(userId),
  ]);
  return { attendedEventIds, attendedTourIds, attendedArtistIds };
}

export interface ResolveLineInput {
  productId: string;
  quantity: number;
  variantId?: string | null;
  dropId?: string | null;
  /** The show the fan is shopping from, used to attribute the cart. */
  eventId?: string | null;
  /**
   * Claimed context from the add-to-cart form. When present the resolved product must
   * match both, which is what stops Artist B's product being bought under Artist A.
   */
  expectedArtistId?: string;
  expectedProductSlug?: string;
  attendance: AttendanceFacts;
  now?: Date;
}

function reject(reason: LineRejection, message: string): LineResult {
  return { ok: false, reason, message };
}

export async function resolveLine(input: ResolveLineInput): Promise<LineResult> {
  const now = input.now ?? demoNow();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, input.productId))
    .limit(1);

  if (!product || !product.active) {
    return reject("product_not_found", "This product is no longer available.");
  }

  if (input.expectedArtistId && product.artistId !== input.expectedArtistId) {
    return reject("product_mismatch", "That product doesn't belong to this artist.");
  }

  if (input.expectedProductSlug && product.slug !== input.expectedProductSlug) {
    return reject("product_mismatch", "That product could not be matched.");
  }

  const variants = await listVariantsWithInventory(product.id);

  let variant;
  if (input.variantId) {
    variant = variants.find((v) => v.id === input.variantId);
    if (!variant) return reject("variant_not_found", "That size is not available.");
  } else if (variants.length === 1) {
    variant = variants[0];
  } else if (variants.length === 0) {
    return reject("variant_not_found", "That size is not available.");
  } else {
    return reject("variant_required", "Please choose a size.");
  }

  if (input.eventId) {
    const [event] = await db
      .select({ id: events.id, artistId: events.artistId })
      .from(events)
      .where(eq(events.id, input.eventId))
      .limit(1);

    if (!event) return reject("event_not_found", "That show could not be found.");
    if (event.artistId !== product.artistId) {
      return reject("event_mismatch", "That product isn't sold at this show.");
    }
    if (product.eventId && product.eventId !== input.eventId) {
      return reject("event_mismatch", "That product isn't sold at this show.");
    }
  }

  let basePriceCents = product.basePriceCents;
  let drop: {
    id: string;
    artistId: string;
    eventId: string | null;
    status: string;
    startsAt: Date;
    endsAt: Date | null;
  } | null = null;

  if (input.dropId) {
    const [dropRow] = await db
      .select({
        id: drops.id,
        artistId: drops.artistId,
        eventId: drops.eventId,
        status: drops.status,
        startsAt: drops.startsAt,
        endsAt: drops.endsAt,
      })
      .from(drops)
      .where(eq(drops.id, input.dropId))
      .limit(1);

    if (!dropRow) return reject("drop_not_found", "That drop could not be found.");
    drop = dropRow;
    if (drop.artistId !== product.artistId) {
      return reject("drop_mismatch", "That product isn't part of this drop.");
    }

    if (input.eventId && drop.eventId && drop.eventId !== input.eventId) {
      return reject("drop_mismatch", "That drop isn't part of this show.");
    }

    const open =
      (drop.status === "live" || drop.status === "scheduled") &&
      drop.startsAt <= now &&
      (drop.endsAt === null || drop.endsAt > now);

    if (!open) return reject("drop_closed", "This drop has ended.");

    const [link] = await db
      .select({ dropPriceCents: dropProducts.dropPriceCents })
      .from(dropProducts)
      .where(and(eq(dropProducts.dropId, drop.id), eq(dropProducts.productId, product.id)))
      .limit(1);

    if (!link) return reject("drop_mismatch", "That product isn't part of this drop.");

    basePriceCents = link.dropPriceCents ?? product.basePriceCents;
  }

  const commerceEventId = input.eventId ?? product.eventId ?? drop?.eventId ?? null;
  if (commerceEventId) {
    const storeOpen = await assertEventAttendeeStoreOpen(
      commerceEventId,
      {
        dropEndsAt: drop?.endsAt ?? null,
        productAvailableUntil: product.availableUntil,
      },
      now,
    );
    if (!storeOpen.ok) {
      return reject("post_show_closed", storeOpen.message);
    }
  }

  const eligibility = await isEligibleForProduct(product, input.attendance, now);
  if (!eligibility.eligible) {
    return reject("not_eligible", eligibility.reason ?? "You are not eligible for this product.");
  }

  if (availableUnits(variant) < input.quantity) {
    return reject("out_of_stock", "Not enough stock.");
  }

  return {
    ok: true,
    line: {
      productId: product.id,
      variantId: variant.id,
      dropId: input.dropId ?? null,
      artistId: product.artistId,
      productEventId: product.eventId,
      name: product.name,
      size: variant.size,
      imageUrl: resolveProductImage(product.id, product.images) ?? null,
      unitPriceCents: basePriceCents + variant.priceDeltaCents,
      unitCostCents: product.unitCostCents,
      quantity: input.quantity,
    },
  };
}

export type CheckoutResolution =
  | {
      ok: true;
      cartId: string;
      artistId: string;
      eventId: string | null;
      tourId: string | null;
      eventContext: CommerceEventContext | null;
      lines: ResolvedLine[];
      subtotalCents: number;
    }
  | { ok: false; reason: LineRejection | "cart_empty" | "multiple_artists"; message: string };

/**
 * Re-derives the whole cart immediately before an order is written.
 *
 * The artist is taken from the cart's own contents rather than from the checkout form,
 * and a cart that somehow spans two artists is refused outright — a single order has one
 * artist, one payout and one fulfillment owner, so there is no correct way to split it.
 */
export async function resolveCartForCheckout(
  userId: string,
  now = demoNow(),
): Promise<CheckoutResolution> {
  const cartData = await getCartWithItems(userId);
  if (!cartData || cartData.items.length === 0) {
    return { ok: false, reason: "cart_empty", message: "Your cart is empty." };
  }

  const { cart, items } = cartData;
  const attendance = await loadAttendanceFacts(userId);
  const lines: ResolvedLine[] = [];

  for (const item of items) {
    if (item.bundleId || !item.productId) {
      return {
        ok: false,
        reason: "unsupported_line",
        message: "An item in your cart can no longer be purchased. Please review your cart.",
      };
    }

    const result = await resolveLine({
      productId: item.productId,
      variantId: item.variantId,
      dropId: item.dropId,
      quantity: item.quantity,
      attendance,
      now,
    });

    if (!result.ok) return result;
    lines.push(result.line);
  }

  const artistIds = new Set(lines.map((l) => l.artistId));
  if (artistIds.size > 1) {
    return {
      ok: false,
      reason: "multiple_artists",
      message: "Your cart has items from more than one artist. Please check out separately.",
    };
  }

  const artistId = lines[0].artistId;

  // The cart's show is attribution only, so a stale or foreign value is dropped rather
  // than failing the order.
  let eventId: string | null = null;
  let tourId: string | null = null;
  if (cart.eventId) {
    const [event] = await db
      .select({ id: events.id, artistId: events.artistId, tourId: events.tourId })
      .from(events)
      .where(eq(events.id, cart.eventId))
      .limit(1);
    if (event && event.artistId === artistId) {
      eventId = event.id;
      tourId = event.tourId;
    }
  }

  const displayEventId = primaryCartEventId(
    eventId,
    items.map((item) => item.sourceEventId),
  );
  const eventContext = await getCommerceEventContext(displayEventId);

  return {
    ok: true,
    cartId: cart.id,
    artistId,
    eventId,
    tourId,
    eventContext,
    lines,
    subtotalCents: lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0),
  };
}

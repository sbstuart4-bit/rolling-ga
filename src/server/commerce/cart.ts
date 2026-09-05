import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, carts } from "@/db/schema";

/** The fan's open cart, created on demand. */
export async function getOrCreateCart(userId: string, eventId?: string | null) {
  const [existing] = await db
    .select()
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, "active")))
    .limit(1);

  if (existing) {
    // Keep the cart pointed at the show the fan is currently shopping from.
    if (eventId && existing.eventId !== eventId) {
      await db.update(carts).set({ eventId }).where(eq(carts.id, existing.id));
      return { ...existing, eventId };
    }
    return existing;
  }

  const [created] = await db
    .insert(carts)
    .values({ userId, eventId: eventId ?? null, status: "active" })
    .returning();

  return created;
}

export async function findActiveCart(userId: string) {
  const [cart] = await db
    .select()
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, "active")))
    .limit(1);
  return cart ?? null;
}

export async function countCartItems(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${cartItems.quantity}), 0)` })
    .from(cartItems)
    .innerJoin(carts, eq(carts.id, cartItems.cartId))
    .where(and(eq(carts.userId, userId), eq(carts.status, "active")));

  return Number(row?.total ?? 0);
}

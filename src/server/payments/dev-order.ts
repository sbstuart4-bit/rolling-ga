import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { carts, inventory, orderItems, orders } from "@/db/schema";
import { generateOrderNumber } from "@/lib/token";
import { demoNow } from "@/server/demo/clock";
import type { CheckoutRequest, CheckoutResult } from "./provider";

/**
 * Materialises an order from a validated checkout request.
 *
 * Inventory is reserved (not decremented — on-hand stays accurate, reserved goes up)
 * so the ops console can tell what is committed. The cart is marked converted so it
 * stops appearing in cart count queries.
 */
export async function createOrderFromCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId: request.userId,
      artistId: request.artistId,
      eventId: request.eventId ?? null,
      commerceSource: request.commerceSource,
      status: "paid",
      subtotalCents: request.subtotalCents,
      discountCents: 0,
      taxCents: request.taxCents,
      shippingCarrierCostCents: request.shippingCarrierCostCents,
      shippingCustomerChargeCents: request.shippingCustomerChargeCents,
      shippingArtistSubsidyCents: request.shippingArtistSubsidyCents,
      totalCents: request.totalCents,
      shippingOptionId: request.shippingOptionId ?? null,
      shippingMethodLabel: request.shippingMethodLabel,
      estimatedDeliveryFrom: request.estimatedDeliveryFrom ?? null,
      estimatedDeliveryTo: request.estimatedDeliveryTo ?? null,
      shippingName: request.shippingName,
      shippingLine1: request.shippingLine1,
      shippingLine2: request.shippingLine2 ?? null,
      shippingCity: request.shippingCity,
      shippingRegion: request.shippingRegion,
      shippingPostalCode: request.shippingPostalCode,
      shippingCountry: request.shippingCountry,
      paymentProvider: "dev",
      paymentMethodKind: "card",
      paymentReference: `dev_${Date.now()}`,
      placedAt: demoNow(),
    })
    .returning({ id: orders.id, orderNumber: orders.orderNumber });

  await db.insert(orderItems).values(
    request.lines.map((line) => ({
      orderId: order.id,
      productId: line.productId ?? null,
      variantId: line.variantId ?? null,
      bundleId: line.bundleId ?? null,
      dropId: line.dropId ?? null,
      nameSnapshot: line.name,
      sizeSnapshot: line.size ?? null,
      imageSnapshot: line.imageUrl ?? null,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      totalCents: line.unitPriceCents * line.quantity,
      unitCostCents: line.unitCostCents ?? null,
    })),
  );

  // Reserve variant inventory
  for (const line of request.lines) {
    if (line.variantId) {
      await db
        .update(inventory)
        .set({ reserved: sql`${inventory.reserved} + ${line.quantity}` })
        .where(eq(inventory.variantId, line.variantId));
    }
  }

  // Close the cart
  await db
    .update(carts)
    .set({ status: "converted" })
    .where(eq(carts.id, request.cartId));

  return { ok: true, orderId: order.id, orderNumber: order.orderNumber };
}

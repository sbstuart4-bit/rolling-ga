import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { drops, orderItems, orders, products } from "@/db/schema";

const PAID = eq(orders.status, "paid");

export interface OrderLineRow {
  orderId: string;
  placedAt: Date | null;
  subtotalCents: number;
  shippingCarrierCostCents: number;
  shippingCustomerChargeCents: number;
  shippingArtistSubsidyCents: number;
  commerceSource: string;
  userId: string;
  quantity: number;
  lineTotalCents: number;
  unitCostCents: number | null;
  productId: string | null;
  dropId: string | null;
  bundleId: string | null;
  isDigital: boolean | null;
  category: string | null;
  productEventId: string | null;
  dropExclusivity: string | null;
}

export async function loadPaidOrderLines(eventId: string, artistId: string): Promise<OrderLineRow[]> {
  return db
    .select({
      orderId: orders.id,
      placedAt: orders.placedAt,
      subtotalCents: orders.subtotalCents,
      shippingCarrierCostCents: orders.shippingCarrierCostCents,
      shippingCustomerChargeCents: orders.shippingCustomerChargeCents,
      shippingArtistSubsidyCents: orders.shippingArtistSubsidyCents,
      commerceSource: orders.commerceSource,
      userId: orders.userId,
      quantity: orderItems.quantity,
      lineTotalCents: orderItems.totalCents,
      unitCostCents: orderItems.unitCostCents,
      productId: orderItems.productId,
      dropId: orderItems.dropId,
      bundleId: orderItems.bundleId,
      isDigital: products.isDigital,
      category: products.category,
      productEventId: products.eventId,
      dropExclusivity: drops.exclusivityType,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .leftJoin(products, eq(products.id, orderItems.productId))
    .leftJoin(drops, eq(drops.id, orderItems.dropId))
    .where(and(eq(orders.eventId, eventId), eq(orders.artistId, artistId), PAID));
}

export function groupOrdersFromLines(lines: OrderLineRow[]) {
  const byOrder = new Map<
    string,
    {
      subtotalCents: number;
      shippingCarrierCostCents: number;
      shippingCustomerChargeCents: number;
      shippingArtistSubsidyCents: number;
      placedAt: Date | null;
      userId: string;
      commerceSource: string;
      lines: { quantity: number; unitPriceCents: number; unitCostCents: number | null }[];
    }
  >();

  for (const line of lines) {
    const existing = byOrder.get(line.orderId) ?? {
      subtotalCents: line.subtotalCents,
      shippingCarrierCostCents: line.shippingCarrierCostCents,
      shippingCustomerChargeCents: line.shippingCustomerChargeCents,
      shippingArtistSubsidyCents: line.shippingArtistSubsidyCents,
      placedAt: line.placedAt,
      userId: line.userId,
      commerceSource: line.commerceSource,
      lines: [],
    };
    existing.lines.push({
      quantity: line.quantity,
      unitPriceCents: Math.round(line.lineTotalCents / Math.max(1, line.quantity)),
      unitCostCents: line.unitCostCents,
    });
    byOrder.set(line.orderId, existing);
  }

  return byOrder;
}

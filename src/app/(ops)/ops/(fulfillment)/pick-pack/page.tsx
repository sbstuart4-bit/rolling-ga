import type { Metadata } from "next";
import { requireAuthWithRole } from "@/server/auth/request";
import { db } from "@/db";
import { artists, orderItems, orders, productVariants } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Pick / Pack — Fulfillment" };

export default async function OpsPickPackPage() {
  await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops/pick-pack");

  const pickableOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      shippingName: orders.shippingName,
      shippingCity: orders.shippingCity,
      artistName: artists.name,
    })
    .from(orders)
    .innerJoin(artists, eq(artists.id, orders.artistId))
    .where(inArray(orders.status, ["allocated", "picking", "packed"]))
    .limit(100);

  return (
    <div className="space-y-5 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Pick / Pack</h1>

      {pickableOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-20 text-center">
          <p className="font-semibold">Nothing to pick right now</p>
          <p className="mt-1 text-sm text-muted-foreground">Orders in allocated, picking, or packed status will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {pickableOrders.map((order) => (
            <li key={order.id} className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs text-muted-foreground">{order.orderNumber}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize
                    ${order.status === "picking" ? "bg-warning/15 text-warning" : order.status === "packed" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm font-medium">{order.shippingName}</p>
                <p className="text-xs text-muted-foreground">{order.artistName}{order.shippingCity ? ` · ${order.shippingCity}` : ""}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

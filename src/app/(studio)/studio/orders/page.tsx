import type { Metadata } from "next";
import Link from "next/link";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { db } from "@/db";
import { artists, orders } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatEventDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Orders — Artist Studio" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  allocated: "Allocated",
  picking: "Picking",
  packed: "Packed",
  ready_to_ship: "Ready to ship",
  shipped: "Shipped",
  delivered: "Delivered",
  exception: "Exception",
  returned: "Returned",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-muted-foreground",
  paid: "text-success",
  allocated: "text-info",
  picking: "text-warning",
  packed: "text-warning",
  ready_to_ship: "text-warning",
  shipped: "text-info",
  delivered: "text-success",
  exception: "text-destructive",
  returned: "text-muted-foreground",
  cancelled: "text-muted-foreground",
};

export default async function StudioOrdersPage() {
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/orders");
  const artistId = defaultArtistId(ctx);

  if (!artistId) return <div className="p-6 text-muted-foreground">Select an artist.</div>;

  const artistOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalCents: orders.totalCents,
      placedAt: orders.placedAt,
      shippingName: orders.shippingName,
      shippingCity: orders.shippingCity,
    })
    .from(orders)
    .where(eq(orders.artistId, artistId))
    .orderBy(desc(orders.placedAt))
    .limit(100);

  return (
    <div className="space-y-5 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>

      {artistOrders.length === 0 ? (
        <p className="text-muted-foreground">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Order #</th>
                <th className="pb-2 pr-4 font-medium">Customer</th>
                <th className="pb-2 pr-4 font-medium">Total</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {artistOrders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/40">
                  <td className="py-3 pr-4">
                    <span className="font-mono text-xs">{order.orderNumber}</span>
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {order.shippingName ?? "—"}
                    {order.shippingCity ? `, ${order.shippingCity}` : ""}
                  </td>
                  <td className="tabular py-3 pr-4 font-medium">{formatMoney(order.totalCents)}</td>
                  <td className="py-3 pr-4">
                    <span className={STATUS_COLOR[order.status] ?? "text-foreground"}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {order.placedAt
                      ? order.placedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

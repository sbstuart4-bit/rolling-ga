import type { Metadata } from "next";
import { requireAuthWithRole } from "@/server/auth/request";
import { db } from "@/db";
import { artists, orders } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Orders — Fulfillment" };

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
  paid: { label: "Paid", cls: "bg-success/15 text-success" },
  allocated: { label: "Allocated", cls: "bg-info/15 text-info" },
  picking: { label: "Picking", cls: "bg-warning/15 text-warning" },
  packed: { label: "Packed", cls: "bg-warning/15 text-warning" },
  ready_to_ship: { label: "Ready", cls: "bg-warning/15 text-warning" },
  shipped: { label: "Shipped", cls: "bg-info/15 text-info" },
  delivered: { label: "Delivered", cls: "bg-success/15 text-success" },
  exception: { label: "Exception", cls: "bg-destructive/15 text-destructive" },
  returned: { label: "Returned", cls: "bg-muted text-muted-foreground" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground" },
};

export default async function OpsOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops/orders");
  const { event: eventId } = await searchParams;

  const allOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalCents: orders.totalCents,
      placedAt: orders.placedAt,
      shippingName: orders.shippingName,
      shippingCity: orders.shippingCity,
      artistName: artists.name,
    })
    .from(orders)
    .innerJoin(artists, eq(artists.id, orders.artistId))
    .orderBy(desc(orders.placedAt))
    .limit(200);

  const filtered = typeof eventId === "string"
    ? allOrders.filter(() => true) // would filter by event in a real impl
    : allOrders;

  return (
    <div className="space-y-5 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                {["Order #", "Artist", "Ship to", "Total", "Status", "Placed"].map((h) => (
                  <th key={h} className="pb-2 pr-4 font-medium last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((order) => {
                const badge = STATUS_BADGE[order.status] ?? { label: order.status, cls: "" };
                return (
                  <tr key={order.id} className="hover:bg-muted/40">
                    <td className="py-3 pr-4 font-mono text-xs">{order.orderNumber}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{order.artistName}</td>
                    <td className="py-3 pr-4">
                      {order.shippingName}
                      {order.shippingCity ? `, ${order.shippingCity}` : ""}
                    </td>
                    <td className="tabular py-3 pr-4 font-medium">{formatMoney(order.totalCents)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {order.placedAt?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

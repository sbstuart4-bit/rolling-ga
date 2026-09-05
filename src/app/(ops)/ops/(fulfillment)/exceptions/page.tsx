import type { Metadata } from "next";
import { requireAuthWithRole } from "@/server/auth/request";
import { db } from "@/db";
import { artists, orders, shipments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Exceptions — Fulfillment" };

export default async function OpsExceptionsPage() {
  await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops/exceptions");

  const exceptionOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      shippingName: orders.shippingName,
      artistName: artists.name,
    })
    .from(orders)
    .innerJoin(artists, eq(artists.id, orders.artistId))
    .where(eq(orders.status, "exception"))
    .orderBy(desc(orders.placedAt))
    .limit(50);

  const exceptionShipments = await db
    .select({
      id: shipments.id,
      exceptionReason: shipments.exceptionReason,
      orderNumber: orders.orderNumber,
      artistName: artists.name,
    })
    .from(shipments)
    .innerJoin(orders, eq(orders.id, shipments.orderId))
    .innerJoin(artists, eq(artists.id, orders.artistId))
    .where(eq(shipments.status, "exception"))
    .orderBy(desc(shipments.createdAt))
    .limit(50);

  const hasExceptions = exceptionOrders.length > 0 || exceptionShipments.length > 0;

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Exceptions</h1>

      {!hasExceptions ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-20 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-semibold">No exceptions</p>
          <p className="mt-1 text-sm text-muted-foreground">All orders and shipments are on track.</p>
        </div>
      ) : (
        <>
          {exceptionOrders.length > 0 && (
            <section className="space-y-3">
              <h2 className="eyebrow text-muted-foreground">Order exceptions</h2>
              <ul className="space-y-2">
                {exceptionOrders.map((order) => (
                  <li key={order.id} className="rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4">
                    <p className="font-medium">{order.shippingName}</p>
                    <p className="text-sm text-muted-foreground">{order.orderNumber} · {order.artistName}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {exceptionShipments.length > 0 && (
            <section className="space-y-3">
              <h2 className="eyebrow text-muted-foreground">Shipment exceptions</h2>
              <ul className="space-y-2">
                {exceptionShipments.map((s) => (
                  <li key={s.id} className="rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4">
                    <p className="font-medium">{s.orderNumber} · {s.artistName}</p>
                    {s.exceptionReason && <p className="text-sm text-muted-foreground">{s.exceptionReason}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

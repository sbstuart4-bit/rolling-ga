import type { Metadata } from "next";
import { requireAuthWithRole } from "@/server/auth/request";
import { db } from "@/db";
import { artists, orders, shipments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Shipments — Fulfillment" };

/**
 * Shipment overview.
 *
 * The `CarrierRateProvider` interface is stubbed out and `labelPurchased` is always
 * false until a real carrier integration exists, so the UI is honest: labels require
 * the carrier handoff that hasn't happened yet, rather than showing a false status.
 */
export default async function OpsShipmentsPage() {
  await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops/shipments");

  const rows = await db
    .select({
      shipmentId: shipments.id,
      status: shipments.status,
      trackingNumber: shipments.trackingNumber,
      labelPurchased: shipments.labelPurchased,
      carrier: shipments.carrier,
      shippedAt: shipments.shippedAt,
      deliveredAt: shipments.deliveredAt,
      exceptionReason: shipments.exceptionReason,
      orderNumber: orders.orderNumber,
      artistName: artists.name,
    })
    .from(shipments)
    .innerJoin(orders, eq(orders.id, shipments.orderId))
    .innerJoin(artists, eq(artists.id, orders.artistId))
    .orderBy(desc(shipments.createdAt))
    .limit(200);

  return (
    <div className="space-y-5 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>

      <div className="rounded-xl border border-border bg-warning/10 px-4 py-3 text-sm text-warning">
        Carrier integration is not configured. Labels must be purchased manually outside Rolling GA.
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">No shipments yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                {["Order #", "Artist", "Carrier", "Tracking", "Status", "Label"].map((h) => (
                  <th key={h} className="pb-2 pr-4 font-medium last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.shipmentId} className="hover:bg-muted/40">
                  <td className="py-3 pr-4 font-mono text-xs">{row.orderNumber}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.artistName}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{row.carrier ?? "—"}</td>
                  <td className="py-3 pr-4">
                    {row.trackingNumber ? (
                      <span className="font-mono text-xs">{row.trackingNumber}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 capitalize">{row.status.replace(/_/g, " ")}</td>
                  <td className="py-3">
                    {row.labelPurchased ? (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">Purchased</span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Required</span>
                    )}
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

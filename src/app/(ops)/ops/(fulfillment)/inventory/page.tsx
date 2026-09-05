import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { requireAuthWithRole } from "@/server/auth/request";
import { db } from "@/db";
import { artists, inventory, productVariants, products } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Inventory — Fulfillment" };

export default async function OpsInventoryPage() {
  await requireAuthWithRole(["fulfillment_operator", "rga_admin"], "/ops/inventory");

  const rows = await db
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      size: productVariants.size,
      productName: products.name,
      artistName: artists.name,
      onHand: inventory.onHand,
      reserved: inventory.reserved,
      reorderPoint: inventory.reorderPoint,
    })
    .from(inventory)
    .innerJoin(productVariants, eq(productVariants.id, inventory.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .innerJoin(artists, eq(artists.id, products.artistId))
    .orderBy(asc(products.name), asc(productVariants.displayOrder));

  return (
    <div className="space-y-5 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">No inventory records.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                {["Product", "Artist", "Size", "On hand", "Reserved", "Available"].map((h) => (
                  <th key={h} className="pb-2 pr-4 font-medium last:pr-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const available = Math.max(0, (row.onHand ?? 0) - (row.reserved ?? 0));
                const shortage = available < (row.reorderPoint ?? 0);
                return (
                  <tr key={row.variantId} className={shortage ? "bg-destructive/5" : "hover:bg-muted/40"}>
                    <td className="py-3 pr-4 font-medium">
                      <div className="flex items-center gap-2">
                        {shortage && <AlertTriangle className="size-3.5 text-destructive" aria-hidden />}
                        {row.productName}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{row.artistName}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{row.size ?? "One size"}</td>
                    <td className="tabular py-3 pr-4">{row.onHand ?? 0}</td>
                    <td className="tabular py-3 pr-4 text-muted-foreground">{row.reserved ?? 0}</td>
                    <td className={`tabular py-3 font-semibold ${shortage ? "text-destructive" : ""}`}>
                      {available}
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

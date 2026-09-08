import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FulfillmentOrderDetailPanel } from "@/components/studio/fulfillment-order-detail";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { loadFulfillmentOrderDetail } from "@/server/studio/fulfillment-queries";

export const metadata: Metadata = { title: "Order — Artist Studio" };

export default async function StudioOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ guided?: string; step?: string; presenter?: string; event?: string }>;
}) {
  const { orderId } = await params;
  const query = await searchParams;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], `/studio/orders/${orderId}`);
  const artistId = defaultArtistId(ctx);

  if (!artistId) {
    return <div className="p-6 text-muted-foreground">Select an artist.</div>;
  }

  const order = await loadFulfillmentOrderDetail(ctx, artistId, orderId);
  if (!order) notFound();

  const backParams = new URLSearchParams();
  if (query.event) backParams.set("event", query.event);
  if (query.guided) backParams.set("guided", query.guided);
  if (query.step) backParams.set("step", query.step);
  if (query.presenter) backParams.set("presenter", query.presenter);
  const backHref = backParams.toString()
    ? `/studio/orders?${backParams.toString()}`
    : "/studio/orders";

  return (
    <div className="p-6">
      <FulfillmentOrderDetailPanel order={order} backHref={backHref} />
    </div>
  );
}

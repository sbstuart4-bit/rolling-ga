import "server-only";
import { and, desc, eq, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { isAttendeeStoreOpen } from "@/lib/post-show-commerce";
import { getCredential } from "@/server/attendance/queries";
import { getStayConnectedState, type StayConnectedState } from "@/server/consent/service";
import type { EventPageContext } from "./context";
import { listEventContent } from "./queries";
import { loadEventShopCatalog } from "./shop";

export interface PostShowOrderLine {
  orderId: string;
  orderNumber: string;
  name: string;
  size: string | null;
  quantity: number;
  totalCents: number;
  placedAt: Date | null;
}

export interface PostShowHubData {
  credential: Awaited<ReturnType<typeof getCredential>>;
  storeOpen: boolean;
  purchasableDropCount: number;
  purchasableProductCount: number;
  orders: PostShowOrderLine[];
  content: Awaited<ReturnType<typeof listEventContent>>;
  stayConnectedState: StayConnectedState;
}

export async function loadPostShowHub(
  page: EventPageContext,
  userId: string,
): Promise<PostShowHubData> {
  const { event, timing } = page;
  const storeOpen = isAttendeeStoreOpen(timing.state);

  const [credential, catalog, content, orderRows, stayConnectedState] = await Promise.all([
    getCredential(userId, event.id),
    loadEventShopCatalog(event, userId),
    listEventContent(event.id, true),
    db
      .select({
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        placedAt: orders.placedAt,
        itemName: orderItems.nameSnapshot,
        itemSize: orderItems.sizeSnapshot,
        quantity: orderItems.quantity,
        totalCents: orderItems.totalCents,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.eventId, event.id),
          notInArray(orders.status, ["cancelled", "pending"]),
        ),
      )
      .orderBy(desc(orders.placedAt)),
    getStayConnectedState(userId, event.artistId),
  ]);

  const purchasableDropCount = catalog.dropSections.filter(
    (section) =>
      !section.expired &&
      !section.notStarted &&
      section.products.some((product) => product.eligibility.eligible),
  ).length;

  const purchasableProductCount = catalog.standaloneProducts.filter(
    ({ eligibility }) => eligibility.eligible,
  ).length;

  return {
    credential,
    storeOpen,
    purchasableDropCount,
    purchasableProductCount,
    orders: orderRows.map((row) => ({
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      name: row.itemName,
      size: row.itemSize,
      quantity: row.quantity,
      totalCents: row.totalCents,
      placedAt: row.placedAt,
    })),
    content,
    stayConnectedState,
  };
}

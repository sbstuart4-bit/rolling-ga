import "server-only";
import {
  listAttendedArtistIds,
  listAttendedEventIds,
  listAttendedTourIds,
} from "@/server/attendance/queries";
import {
  listDropProducts,
  listDropsForEventShop,
  listStandaloneProductsForEvent,
} from "@/server/catalog/queries";
import { demoNow } from "@/server/demo/clock";
import { enrichDropArtwork } from "@/lib/demo-drop-artwork";
import { getDemoAwareProductEligibility } from "@/server/demo/scenario-eligibility";
import type { EventRow } from "./queries";

export async function loadEventShopCatalog(event: EventRow, userId: string) {
  const now = demoNow();
  const [drops, standaloneProducts, attendedEventIds, attendedTourIds, attendedArtistIds] =
    await Promise.all([
      listDropsForEventShop(
        { eventId: event.id, tourId: event.tourId, artistId: event.artistId },
        now,
      ),
      listStandaloneProductsForEvent(event.id, event.artistId),
      listAttendedEventIds(userId),
      listAttendedTourIds(userId),
      listAttendedArtistIds(userId),
    ]);

  const attendance = { attendedEventIds, attendedTourIds, attendedArtistIds };

  const dropSections = await Promise.all(
    drops.map(async (drop) => {
      const items = await listDropProducts(drop.id);
      const products = await Promise.all(
        items.map(async (item) => ({
          ...item,
          priceCents: item.dropPriceCents ?? item.basePriceCents,
          eligibility: await getDemoAwareProductEligibility(
            {
              accessType: item.accessType,
              eventId: item.eventId,
              tourId: item.tourId,
              availableFrom: item.availableFrom,
              availableUntil: item.availableUntil,
            },
            attendance,
            event.id,
            now,
          ),
        })),
      );

      return {
        drop: enrichDropArtwork(drop, items[0]),
        products,
        expired: drop.endsAt !== null && drop.endsAt < now,
        isFlash: drop.endsAt !== null,
        notStarted: drop.startsAt > now,
      };
    }),
  );

  const dropProductIds = new Set(dropSections.flatMap((section) => section.products.map((p) => p.id)));

  const standalone = (
    await Promise.all(
      standaloneProducts.map(async (product) => ({
        product,
        eligibility: await getDemoAwareProductEligibility(product, attendance, event.id, now),
      })),
    )
  ).filter(({ product }) => !dropProductIds.has(product.id));

  return { dropSections, standaloneProducts: standalone, now };
}

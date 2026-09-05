import type { DropExclusivityType, ProductAccessType, ProductCategory } from "@/lib/types";
import { DROP_EXCLUSIVITY_LABELS } from "@/lib/types";

/** Short shelf tag for a product card — derived from drop context and product metadata. */
export function eventShopProductTag({
  dropExclusivity,
  accessType,
  category,
}: {
  dropExclusivity?: DropExclusivityType | null;
  accessType?: ProductAccessType | null;
  category?: ProductCategory | null;
}): string | null {
  if (dropExclusivity && dropExclusivity !== "standard") {
    const label = DROP_EXCLUSIVITY_LABELS[dropExclusivity];
    return label.replace(/ drop$/i, "");
  }

  if (accessType === "event_specific") return "Show";
  if (accessType === "verified_attendee") return "Attendee";
  if (accessType === "tour_specific") return "Tour";
  if (accessType === "previous_attendee") return "Returning";

  if (category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  return null;
}

/**
 * Shared shipping address shape for checkout and fan preferences.
 * Kept client-safe so checkout UI can pre-fill without importing server code.
 */

export interface ShippingAddressFields {
  shippingName: string;
  shippingLine1: string;
  shippingLine2: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPostalCode: string;
  shippingCountry: string;
}

export type SavedShippingAddress = Partial<ShippingAddressFields>;

const SHIPPING_FIELD_KEYS = [
  "shippingName",
  "shippingLine1",
  "shippingLine2",
  "shippingCity",
  "shippingRegion",
  "shippingPostalCode",
  "shippingCountry",
] as const satisfies readonly (keyof ShippingAddressFields)[];

export function emptyShippingAddress(country = "US"): ShippingAddressFields {
  return {
    shippingName: "",
    shippingLine1: "",
    shippingLine2: "",
    shippingCity: "",
    shippingRegion: "",
    shippingPostalCode: "",
    shippingCountry: country,
  };
}

/** Merge saved preference fields onto checkout defaults; missing fields stay blank. */
export function mergeSavedShippingAddress(
  saved: SavedShippingAddress | null | undefined,
  countryDefault = "US",
): ShippingAddressFields {
  const base = emptyShippingAddress(countryDefault);
  if (!saved) return base;

  return {
    shippingName: saved.shippingName?.trim() ?? base.shippingName,
    shippingLine1: saved.shippingLine1?.trim() ?? base.shippingLine1,
    shippingLine2: saved.shippingLine2?.trim() ?? base.shippingLine2,
    shippingCity: saved.shippingCity?.trim() ?? base.shippingCity,
    shippingRegion: saved.shippingRegion?.trim() ?? base.shippingRegion,
    shippingPostalCode: saved.shippingPostalCode?.trim() ?? base.shippingPostalCode,
    shippingCountry: saved.shippingCountry?.trim() ?? base.shippingCountry,
  };
}

/** True when any shipping column is populated — partial addresses still pre-fill. */
export function hasSavedShippingAddress(saved: SavedShippingAddress | null | undefined): boolean {
  if (!saved) return false;
  return SHIPPING_FIELD_KEYS.some((key) => Boolean(saved[key]?.trim()));
}

/** True when every required checkout field is present. */
export function isCompleteShippingAddress(address: ShippingAddressFields): boolean {
  return Boolean(
    address.shippingName.trim() &&
      address.shippingLine1.trim() &&
      address.shippingCity.trim() &&
      address.shippingRegion.trim() &&
      address.shippingPostalCode.trim() &&
      address.shippingCountry.trim(),
  );
}

export function formatShippingAddressSummary(address: ShippingAddressFields): string {
  const line2 = address.shippingLine2.trim();
  const cityLine = [address.shippingCity, address.shippingRegion, address.shippingPostalCode]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  return [
    address.shippingName.trim(),
    address.shippingLine1.trim(),
    line2 || null,
    cityLine,
    address.shippingCountry.trim(),
  ]
    .filter(Boolean)
    .join(" · ");
}

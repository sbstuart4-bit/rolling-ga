import { APPAREL_SIZES, type ApparelSize } from "@/lib/types";

export interface SizedVariantOption {
  id: string;
  size: string | null;
  available: number;
}

export type PreferredSizeResolution =
  | { kind: "none" }
  | { kind: "matched"; variantId: string; size: string }
  | { kind: "unavailable"; savedSize: string }
  | { kind: "not_in_product"; savedSize: string };

export function isApparelSize(value: string | null | undefined): value is ApparelSize {
  if (!value) return false;
  return (APPAREL_SIZES as readonly string[]).includes(value.trim().toUpperCase());
}

/** Resolves whether a saved size can preselect a variant on this product. */
export function resolvePreferredVariant(
  variants: SizedVariantOption[],
  savedSize: string | null | undefined,
): PreferredSizeResolution {
  if (!variants.length || !savedSize?.trim()) return { kind: "none" };

  const normalized = savedSize.trim().toUpperCase();
  const match = variants.find((variant) => variant.size?.trim().toUpperCase() === normalized);
  if (!match) return { kind: "not_in_product", savedSize: normalized };
  if (match.available <= 0) return { kind: "unavailable", savedSize: normalized };
  return { kind: "matched", variantId: match.id, size: match.size!.trim().toUpperCase() };
}

/** Picks the initial variant — never preselects an unavailable saved size. */
export function initialVariantSelection(
  variants: SizedVariantOption[],
  savedSize: string | null | undefined,
): { variantId: string; resolution: PreferredSizeResolution } {
  if (!variants.length) return { variantId: "", resolution: { kind: "none" } };

  const resolution = resolvePreferredVariant(variants, savedSize);
  if (resolution.kind === "matched") {
    return { variantId: resolution.variantId, resolution };
  }

  const firstAvailable = variants.find((variant) => variant.available > 0) ?? variants[0];
  return { variantId: firstAvailable?.id ?? "", resolution };
}

export function normalizeApparelSize(size: string): ApparelSize | null {
  const normalized = size.trim().toUpperCase();
  return isApparelSize(normalized) ? normalized : null;
}

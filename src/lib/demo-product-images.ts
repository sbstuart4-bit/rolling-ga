/**
 * Canonical demo image resolution.
 *
 * Product rows store URLs at seed time, but stale databases may still hold generated
 * SVG placeholders. At runtime we always prefer the canonical map when a PNG exists.
 */
import { demoModeEnabled } from "@/lib/demo-mode";
import {
  DEMO_PRODUCT_IMAGES,
  demoProductImage,
  type DemoProductId,
} from "@/lib/demo-assets";

const GENERATED_SVG_PATTERN = /^\/demo\/product-.+\.svg$/;

/** Prefer canonical demo photography over stale seeded SVG placeholders. */
export function resolveProductImages(
  productId: string,
  storedImages: string[] | null | undefined,
): string[] {
  const canonical = demoProductImage(productId);
  if (canonical) return [canonical];

  if (!demoModeEnabled()) {
    return storedImages?.length ? storedImages : [];
  }

  const stored = storedImages?.[0];
  if (stored && !GENERATED_SVG_PATTERN.test(stored)) {
    return storedImages!;
  }

  return storedImages?.length ? storedImages : [];
}

export function resolveProductImage(
  productId: string,
  storedImages: string[] | null | undefined,
): string | undefined {
  return resolveProductImages(productId, storedImages)[0];
}

export function enrichProductRow<T extends { id: string; images: string[] | null }>(
  row: T,
): T {
  return { ...row, images: resolveProductImages(row.id, row.images) };
}

export function enrichProductRows<T extends { id: string; images: string[] | null }>(
  rows: T[],
): T[] {
  return rows.map(enrichProductRow);
}

/** All canonical product paths — used by tests and the asset audit page. */
export function allCanonicalProductImagePaths(): string[] {
  return Object.values(DEMO_PRODUCT_IMAGES);
}

export function isCanonicalDemoProductId(productId: string): productId is DemoProductId {
  return productId in DEMO_PRODUCT_IMAGES;
}

export function isStaleDemoProductSvg(url: string | null | undefined): boolean {
  return Boolean(url && GENERATED_SVG_PATTERN.test(url));
}

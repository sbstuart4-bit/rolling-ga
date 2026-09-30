import type { DemoAssetAuditEntry } from "@/lib/demo-asset-audit-types";

/** Best preview URL for the Asset QA grid — prefers PNG pairs over raw SVG when available. */
export function resolveAssetPreviewPath(entry: DemoAssetAuditEntry): string {
  if (/\.(png|jpe?g|webp)$/i.test(entry.path) && entry.fileExists) {
    return entry.path;
  }
  if (entry.duplicateOf && /\.(png|jpe?g|webp)$/i.test(entry.duplicateOf)) {
    return `/demo/${entry.duplicateOf}`;
  }
  return entry.path;
}

export function isVectorAssetPath(path: string): boolean {
  return /\.svg(\?.*)?$/i.test(path);
}

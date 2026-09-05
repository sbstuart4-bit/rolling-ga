import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Products — Rolling GA Ops" };

export default function PlatformOpsProductsPlaceholder() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
      <p className="text-sm text-muted-foreground text-balance">
        Full cross-artist product catalog browsing is planned. Asset QA maps every seeded product
        ID to its canonical photography path.
      </p>
      <Link href="/ops/assets" className="inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-sky-500/40">
        Open Asset QA
      </Link>
    </div>
  );
}

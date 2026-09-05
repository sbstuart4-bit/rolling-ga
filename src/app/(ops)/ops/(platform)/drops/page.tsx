import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Drops — Rolling GA Ops" };

export default function PlatformOpsDropsPlaceholder() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Drops</h1>
      <p className="text-sm text-muted-foreground text-balance">
        Cross-artist drop catalog inspection is planned. Use Asset QA to verify drop product
        imagery, or enter the fan drops route from a configured scenario.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/ops/assets" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-sky-500/40">
          Asset QA
        </Link>
        <Link href="/demo?perspective=fan" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-sky-500/40">
          Fan demo scenarios
        </Link>
      </div>
    </div>
  );
}

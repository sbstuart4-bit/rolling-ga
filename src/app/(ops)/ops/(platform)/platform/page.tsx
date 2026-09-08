import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformOpsOverview } from "@/server/ops/queries";

export const metadata: Metadata = { title: "Rolling GA Ops — Platform" };
export const dynamic = "force-dynamic";

export default async function PlatformOpsOverviewPage() {
  const overview = await getPlatformOpsOverview();

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="eyebrow text-sky-400/80">Rolling GA Ops</p>
        <h1 className="text-2xl font-semibold tracking-tight">Platform operations</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Cross-artist operational visibility across all demo accounts. Inspect artists, catalog,
          and imagery without impersonating artist teams.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Artists" value={overview.artistCount} href="/ops/artists" />
        <SummaryCard label="Shows" value={overview.showCount} href="/ops/shows" />
        <SummaryCard label="Products" value={overview.productCount} href="/ops/products" />
        <SummaryCard
          label="Asset issues"
          value={overview.assetIssues}
          href="/ops/assets"
          highlight={overview.assetIssues > 0}
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Operational areas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AreaLink href="/ops/artists" title="Artists" description="Cross-account artist inspection" />
          <AreaLink href="/ops/shows" title="Shows" description="Demo events across all tours" />
          <AreaLink href="/ops/drops" title="Drops" description="Live and scheduled drops" />
          <AreaLink href="/ops/products" title="Products" description="Catalog and merch photography" />
          <AreaLink href="/ops/assets" title="Assets" description="Image mapping and QA audit" />
          <AreaLink href="/demo?perspective=ops" title="Demo / QA" description="Scenario engine and demo board" />
        </div>
      </section>

      <section className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-5">
        <h2 className="font-semibold text-sky-100">Fulfillment command center</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Show operations, promise control, and prioritized exceptions for Rolling GA internal ops.
        </p>
        <Link href="/ops" className="mt-3 inline-block text-sm font-medium text-sky-400 hover:underline">
          Open command center →
        </Link>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        highlight
          ? "rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 transition-colors hover:bg-amber-500/10"
          : "rounded-xl border border-border bg-card/50 p-5 transition-colors hover:bg-card"
      }
    >
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular">{value}</p>
    </Link>
  );
}

function AreaLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-card/30 p-4 transition-colors hover:border-sky-500/30 hover:bg-card/60"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}

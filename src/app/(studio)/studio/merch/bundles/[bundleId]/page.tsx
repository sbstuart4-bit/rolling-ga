import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { PRODUCT_ACCESS_LABELS } from "@/lib/types";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { getBundleForStudio } from "@/server/studio/merch-queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bundleId: string }>;
}): Promise<Metadata> {
  const { bundleId } = await params;
  return { title: `Bundle ${bundleId} — Artist Studio` };
}

export default async function StudioBundlePage({
  params,
}: {
  params: Promise<{ bundleId: string }>;
}) {
  const { bundleId } = await params;
  const ctx = await requireAuthWithRole(
    ["artist_member", "rga_admin"],
    `/studio/merch/bundles/${bundleId}`,
  );
  const artistId = defaultArtistId(ctx);

  if (!artistId) notFound();

  const detail = await getBundleForStudio(ctx, artistId, bundleId);
  if (!detail) notFound();

  const { bundle, items, retailSum, savingsCents } = detail;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/studio/merch">
          <ArrowLeft className="size-4" aria-hidden />
          Back to merch
        </Link>
      </Button>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{bundle.name}</h1>
        {bundle.description && <p className="text-muted-foreground">{bundle.description}</p>}
        <p className="text-sm text-muted-foreground">{PRODUCT_ACCESS_LABELS[bundle.accessType]}</p>
      </header>

      <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4">
        <dl className="grid grid-cols-3 gap-4 text-sm tabular">
          <div>
            <dt className="text-muted-foreground">Bundle price</dt>
            <dd className="text-lg font-semibold">{formatMoney(bundle.bundlePriceCents)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Retail sum</dt>
            <dd>{formatMoney(retailSum)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fan savings</dt>
            <dd className="text-emerald-400">{formatMoney(savingsCents)}</dd>
          </div>
        </dl>

        <ul className="divide-y divide-border rounded-xl border border-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              {item.images?.[0] && (
                <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image src={item.images[0]} alt="" fill className="object-cover" sizes="40px" />
                </div>
              )}
              <span className="flex-1 text-sm">{item.productName}</span>
              <span className="text-sm tabular text-muted-foreground">×{item.quantity}</span>
              <span className="text-sm tabular">{formatMoney(item.basePriceCents)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPlatformOpsOverview, listPlatformOpsArtists } from "@/server/ops/queries";

export const metadata: Metadata = { title: "Artists — Rolling GA Ops" };
export const dynamic = "force-dynamic";

export default async function PlatformOpsArtistsPage() {
  const [artists, overview] = await Promise.all([
    listPlatformOpsArtists(),
    getPlatformOpsOverview(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Artists</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cross-account inspection — {overview.artistCount} demo artists on platform.
        </p>
      </header>

      <ul className="grid gap-4 lg:grid-cols-2">
        {artists.map((artist) => (
          <li
            key={artist.id}
            className="flex gap-4 rounded-xl border border-border bg-card/40 p-4"
          >
            <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted/30">
              <Image
                src={artist.logoUrl}
                alt=""
                fill
                className="object-contain p-2"
                sizes="80px"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="font-semibold">{artist.name}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{artist.bio}</p>
              </div>
              <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <div>
                  <dt className="text-muted-foreground">Shows</dt>
                  <dd className="font-medium tabular">{artist.showCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Products</dt>
                  <dd className="font-medium tabular">{artist.productCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Asset issues</dt>
                  <dd
                    className={
                      artist.assetIssues > 0
                        ? "font-medium tabular text-amber-400"
                        : "font-medium tabular text-emerald-400"
                    }
                  >
                    {artist.assetIssues}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/ops/artists/${artist.id}?artist=${artist.assetKey}`}
                className="inline-block text-sm font-medium text-sky-400 hover:underline"
              >
                View account →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

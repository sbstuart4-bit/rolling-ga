import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildArtistQaMatrix,
  buildDemoAssetAudit,
  qaSurfaceLabel,
} from "@/lib/demo-asset-audit";
import { getPlatformOpsArtist } from "@/server/ops/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ artistId: string }>;
}): Promise<Metadata> {
  const { artistId } = await params;
  const artist = await getPlatformOpsArtist(artistId);
  return { title: artist ? `${artist.name} — Rolling GA Ops` : "Artist not found" };
}

export default async function PlatformOpsArtistDetailPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const artist = await getPlatformOpsArtist(artistId);
  if (!artist) notFound();

  const auditEntries = buildDemoAssetAudit();
  const qa = buildArtistQaMatrix(artist.assetKey, auditEntries);
  const artistAssets = auditEntries.filter((e) => e.artist === artist.assetKey);

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        <Link href="/ops/artists" className="text-sky-400 hover:underline">
          ← All artists
        </Link>
      </p>

      <header className="flex flex-wrap items-start gap-6">
        <div className="relative size-28 overflow-hidden rounded-xl bg-muted/30">
          <Image src={artist.logoUrl} alt="" fill className="object-contain p-3" sizes="112px" />
        </div>
        <div className="space-y-2">
          <p className="eyebrow text-sky-400/80">Operational inspection</p>
          <h1 className="text-2xl font-semibold tracking-tight">{artist.name}</h1>
          <p className="max-w-xl text-sm text-muted-foreground">{artist.bio}</p>
          <p className="text-xs text-muted-foreground">
            Viewing: <span className="font-medium text-foreground">{artist.name}</span> — Ops
            perspective, not artist impersonation.
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Shows" value={artist.showCount} />
        <Metric label="Products" value={artist.productCount} />
        <Metric label="Asset issues" value={artist.assetIssues} warn={artist.assetIssues > 0} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Visual QA matrix
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/20 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Surface</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Expected</th>
                <th className="px-4 py-3">Actual</th>
                <th className="px-4 py-3">Root cause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {qa.results.map((row) => (
                <tr key={row.surface}>
                  <td className="px-4 py-3 font-medium">{qaSurfaceLabel(row.surface)}</td>
                  <td className="px-4 py-3">
                    <span className={row.pass ? "text-emerald-400" : "text-amber-400"}>
                      {row.pass ? "PASS" : "FAIL"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.expected ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.actual ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.rootCause ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Assets ({artistAssets.length})
          </h2>
          <Link
            href={`/ops/assets?artist=${artist.assetKey}`}
            className="text-sm text-sky-400 hover:underline"
          >
            Open in Asset QA →
          </Link>
        </div>
        <ul className="grid gap-2 text-xs font-mono text-muted-foreground sm:grid-cols-2">
          {artistAssets.slice(0, 12).map((a) => (
            <li key={a.path} className="truncate rounded border border-border px-3 py-2">
              {a.filename} · {a.statusLabel}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular ${warn ? "text-amber-400" : ""}`}>
        {value}
      </p>
    </div>
  );
}

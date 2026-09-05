"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { DemoAssetAuditEntry, DemoAssetArtist } from "@/lib/demo-asset-audit";

const FILTER_LABELS: Record<string, string> = {
  all: "All",
  the_degens: "Degens",
  nova_kestrel: "Nova",
  the_low_country: "Low Country",
  marisol_reyes: "Marisol",
  unmapped: "Unmapped",
  broken: "Broken",
  unused: "Unused",
};

export function DemoAssetAuditGrid({
  entries,
  summary,
}: {
  entries: DemoAssetAuditEntry[];
  summary: {
    total: number;
    theDegens: number;
    novaKestrel: number;
    lowCountry: number;
    marisolReyes: number;
    unknown: number;
    referenced: number;
    unused: number;
    broken: number;
    placeholderSvgs: number;
  };
}) {
  const [filter, setFilter] = React.useState<string>("all");

  const filtered = entries.filter((entry) => {
    switch (filter) {
      case "the_degens":
      case "nova_kestrel":
      case "the_low_country":
      case "marisol_reyes":
        return entry.artist === filter;
      case "unmapped":
        return entry.assetType === "product" && entry.extension === "png" && !entry.referenced;
      case "broken":
        return entry.broken;
      case "unused":
        return !entry.referenced && entry.assetType !== "placeholder_svg";
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Total files" value={summary.total} />
        <Stat label="Referenced" value={summary.referenced} />
        <Stat label="Unused PNGs" value={summary.unused} />
        <Stat label="Broken refs" value={summary.broken} />
        <Stat label="SVG placeholders" value={summary.placeholderSvgs} />
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(FILTER_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={
              filter === key
                ? "rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground"
                : "rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entry) => (
          <AssetCard key={entry.path} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular">{value}</p>
    </div>
  );
}

function AssetCard({ entry }: { entry: DemoAssetAuditEntry }) {
  const isSvg = entry.extension === "svg";
  const [loadFailed, setLoadFailed] = React.useState(false);
  const statusColor = entry.broken || loadFailed
    ? "text-red-400"
    : entry.referenced
      ? "text-emerald-400"
      : "text-muted-foreground";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[4/5] bg-muted">
        {isSvg ? (
          <div className="flex size-full items-center justify-center p-4 text-xs text-muted-foreground">
            SVG placeholder
          </div>
        ) : (
          <Image
            src={entry.path}
            alt=""
            fill
            className="object-contain p-2"
            sizes="320px"
            onError={() => setLoadFailed(true)}
          />
        )}
        {(entry.broken || loadFailed) && (
          <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            Broken
          </span>
        )}
      </div>
      <div className="space-y-1 p-3 text-left text-xs">
        <p className="font-mono text-[11px] break-all">{entry.filename}</p>
        <p>
          <span className="text-muted-foreground">Artist:</span> {entry.artist.replace(/_/g, " ")}
        </p>
        <p>
          <span className="text-muted-foreground">Type:</span> {entry.assetType}
        </p>
        {entry.entityId && (
          <p>
            <span className="text-muted-foreground">Entity:</span> {entry.entityId}
          </p>
        )}
        <p className={statusColor}>
          Referenced: {entry.referenced ? "yes" : "no"}
          {entry.referenceLocations[0] ? ` · ${entry.referenceLocations[0]}` : ""}
        </p>
      </div>
    </div>
  );
}

export function DemoAssetAuditNav() {
  return (
    <p className="text-sm text-muted-foreground">
      <Link href="/demo" className="text-primary hover:underline">
        ← Demo board
      </Link>
    </p>
  );
}

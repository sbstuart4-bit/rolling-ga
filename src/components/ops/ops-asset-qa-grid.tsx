"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { DemoAssetAuditEntry, DemoAssetStatus } from "@/lib/demo-asset-audit-types";
import {
  isVectorAssetPath,
  resolveAssetPreviewPath,
} from "@/lib/demo-asset-audit-preview";

const FILTER_LABELS: Record<string, string> = {
  all: "All",
  the_degens: "Degens",
  nova_kestrel: "Nova Kestrel",
  the_low_country: "Low Country",
  marisol_reyes: "Marisol Reyes",
  unmapped: "Unmapped",
  broken: "Broken",
  unused: "Unused",
  placeholder: "Placeholders",
};

const STATUS_CLASS: Record<DemoAssetStatus, string> = {
  mapped: "text-emerald-400",
  unused: "text-amber-400",
  unmapped: "text-amber-400",
  missing: "text-red-400",
  broken: "text-red-400",
  placeholder_active: "text-amber-300",
};

export function OpsAssetQaGrid({
  entries,
  summary,
  backHref = "/ops/platform",
  backLabel = "← Platform ops",
}: {
  entries: DemoAssetAuditEntry[];
  summary: {
    total: number;
    mapped: number;
    unused: number;
    unmapped: number;
    broken: number;
    missing: number;
    placeholderSvgs: number;
  };
  backHref?: string;
  backLabel?: string;
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
        return entry.status === "unmapped";
      case "broken":
        return entry.status === "broken" || entry.status === "missing";
      case "unused":
        return entry.status === "unused";
      case "placeholder":
        return entry.status === "placeholder_active";
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        <Link href={backHref} className="text-sky-400 hover:underline">
          {backLabel}
        </Link>
      </p>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Total assets" value={summary.total} />
        <Stat label="Mapped" value={summary.mapped} />
        <Stat label="Unused" value={summary.unused} />
        <Stat label="Missing" value={summary.missing} />
        <Stat label="Broken" value={summary.broken} />
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(FILTER_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={
              filter === key
                ? "rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white"
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
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular">{value}</p>
    </div>
  );
}

function AssetCard({ entry }: { entry: DemoAssetAuditEntry }) {
  const previewSrc = resolveAssetPreviewPath(entry);
  const isVector = isVectorAssetPath(previewSrc);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const statusClass = STATUS_CLASS[entry.status];
  const showBroken = entry.broken || loadFailed || (!entry.fileExists && entry.status === "missing");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/50">
      <div className="relative aspect-[4/5] bg-muted/30">
        {showBroken ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-muted-foreground">
            <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              No preview
            </span>
            <span>{entry.status === "missing" ? "File missing on disk" : "Image failed to load"}</span>
          </div>
        ) : isVector ? (
          // eslint-disable-next-line @next/next/no-img-element -- SVG previews for Asset QA
          <img
            src={previewSrc}
            alt=""
            className="absolute inset-0 size-full object-contain p-2"
            onError={() => setLoadFailed(true)}
          />
        ) : (
          <Image
            src={previewSrc}
            alt=""
            fill
            className="object-contain p-2"
            sizes="320px"
            onError={() => setLoadFailed(true)}
          />
        )}
      </div>
      <div className="space-y-1 p-3 text-left text-xs">
        <p className="font-mono text-[11px] break-all">{entry.filename}</p>
        <p>
          <span className="text-muted-foreground">Artist:</span>{" "}
          {entry.artist.replace(/_/g, " ")}
        </p>
        <p>
          <span className="text-muted-foreground">Type:</span> {entry.assetType.replace(/_/g, " ")}
        </p>
        {entry.entityId && (
          <p>
            <span className="text-muted-foreground">Entity:</span> {entry.entityId}
          </p>
        )}
        <p className={statusClass}>{entry.statusLabel}</p>
        {entry.unmappedReason && (
          <p className="text-muted-foreground">
            Reason: {entry.unmappedReason.replace(/_/g, " ")}
          </p>
        )}
        {entry.duplicateOf && (
          <p className="text-muted-foreground">Pairs with: {entry.duplicateOf}</p>
        )}
        {entry.referenceLocations[0] && (
          <p className="text-muted-foreground">{entry.referenceLocations[0]}</p>
        )}
      </div>
    </div>
  );
}

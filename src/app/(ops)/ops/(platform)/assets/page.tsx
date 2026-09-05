import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OpsAssetQaGrid } from "@/components/ops/ops-asset-qa-grid";
import {
  buildDemoAssetAudit,
  missingProductAssets,
  summarizeDemoAssetAudit,
  unmappedProductAssets,
} from "@/lib/demo-asset-audit";
import { demoModeEnabled } from "@/lib/demo-mode";

export const metadata: Metadata = { title: "Asset QA — Rolling GA Ops" };
export const dynamic = "force-dynamic";

export default function PlatformOpsAssetsPage() {
  if (!demoModeEnabled()) redirect("/welcome");

  const entries = buildDemoAssetAudit();
  const summary = summarizeDemoAssetAudit(entries);
  const unmapped = unmappedProductAssets(entries);
  const missing = missingProductAssets(entries);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="eyebrow text-sky-400/80">Rolling GA Ops</p>
        <h1 className="text-2xl font-semibold tracking-tight">Asset QA</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Every file in <code className="text-foreground">/public/demo</code>, its mapped entity,
          and whether the canonical registry references it across all four demo artists.
        </p>
      </header>

      <OpsAssetQaGrid entries={entries} summary={summary} />

      {(unmapped.length > 0 || missing.length > 0) && (
        <section className="grid gap-6 lg:grid-cols-2">
          {unmapped.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <h2 className="font-semibold text-amber-200">
                Unmapped product PNGs ({unmapped.length})
              </h2>
              <ul className="mt-2 space-y-1 font-mono text-xs text-amber-100/80">
                {unmapped.map((e) => (
                  <li key={e.path}>{e.filename}</li>
                ))}
              </ul>
            </div>
          )}
          {missing.length > 0 && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <h2 className="font-semibold text-red-200">
                Missing seeded product files ({missing.length})
              </h2>
              <ul className="mt-2 space-y-1 font-mono text-xs text-red-100/80">
                {missing.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

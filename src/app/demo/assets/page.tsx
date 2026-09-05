import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DemoAssetAuditGrid, DemoAssetAuditNav } from "@/components/demo/demo-asset-audit-grid";
import {
  buildDemoAssetAudit,
  missingProductAssets,
  summarizeDemoAssetAudit,
  unmappedProductAssets,
} from "@/lib/demo-asset-audit";
import { demoModeEnabled } from "@/lib/demo-mode";

export const metadata: Metadata = { title: "Demo asset audit — Rolling GA" };
export const dynamic = "force-dynamic";

export default function DemoAssetAuditPage() {
  if (!demoModeEnabled()) redirect("/welcome");

  const entries = buildDemoAssetAudit();
  const summary = summarizeDemoAssetAudit(entries);
  const unmapped = unmappedProductAssets(entries);
  const missing = missingProductAssets(entries);

  return (
    <div className="min-h-dvh bg-[#121212] px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <DemoAssetAuditNav />

        <header className="space-y-2">
          <p className="eyebrow text-muted-foreground">Demo QA</p>
          <h1 className="font-display text-3xl tracking-wide">Asset audit</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Every file in <code className="text-foreground">/public/demo</code>, its mapped entity,
            and whether the canonical registry references it. Not linked in production navigation.
          </p>
        </header>

        <DemoAssetAuditGrid entries={entries} summary={summary} />

        {(unmapped.length > 0 || missing.length > 0) && (
          <section className="grid gap-6 lg:grid-cols-2">
            {unmapped.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <h2 className="font-semibold text-amber-200">Unmapped product PNGs ({unmapped.length})</h2>
                <ul className="mt-2 space-y-1 text-xs font-mono text-amber-100/80">
                  {unmapped.map((e) => (
                    <li key={e.path}>{e.filename}</li>
                  ))}
                </ul>
              </div>
            )}
            {missing.length > 0 && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                <h2 className="font-semibold text-red-200">Missing seeded product files ({missing.length})</h2>
                <ul className="mt-2 space-y-1 text-xs font-mono text-red-100/80">
                  {missing.map((id) => (
                    <li key={id}>{id}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/demo" className="text-primary hover:underline">
            Return to demo board
          </Link>
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ClipboardCheck, LayoutDashboard, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Demo Board panel when Rolling GA Ops perspective is selected. */
export function DemoOpsControls() {
  return (
    <section className="space-y-5 rounded-2xl border border-sky-500/30 bg-sky-500/5 p-6 text-left">
      <div>
        <p className="eyebrow text-sky-300/80">Rolling GA Ops</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Platform operations</h2>
        <p className="mt-2 text-sm text-muted-foreground text-balance">
          Cross-artist visibility across all demo accounts — inspect artists, shows, products,
          and imagery without impersonating an artist team.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <QuickAction
          href="/ops"
          icon={LayoutDashboard}
          label="Enter Ops"
          description="Platform overview and operational areas"
        />
        <QuickAction
          href="/ops/assets"
          icon={ClipboardCheck}
          label="Asset QA"
          description="Audit all demo imagery across four artists"
        />
        <QuickAction
          href="/demo?perspective=fan"
          icon={PlayCircle}
          label="Run demo QA"
          description="Return to fan scenario controls"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild className="h-11 bg-sky-600 uppercase tracking-wider hover:bg-sky-600/90">
          <Link href="/ops">Enter Rolling GA Ops</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 uppercase tracking-wider">
          <Link href="/ops/assets">Open asset QA</Link>
        </Button>
      </div>
    </section>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-xl border border-border bg-card/80 p-4 transition-colors hover:border-sky-500/40 hover:bg-card"
    >
      <Icon className="size-5 text-sky-400" aria-hidden />
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </Link>
  );
}

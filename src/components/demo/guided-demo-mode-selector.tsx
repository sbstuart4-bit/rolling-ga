"use client";

import Link from "next/link";
import { Compass, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GuidedDemoModeSelector({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-6 text-left",
        className,
      )}
    >
      <h2 className="text-lg font-semibold tracking-tight">Explore the fan product</h2>
      <p className="mt-2 text-sm text-muted-foreground text-balance">
        Run a presenter-led walkthrough of the real fan journey, or configure a scenario manually
        for QA.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-border bg-background/60 p-4">
          <div className="flex items-center gap-2 text-primary">
            <Compass className="size-4" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider">Explore manually</span>
          </div>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            Use the scenario controls below to set clock, fan state, and location — then enter the
            fan experience.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">Scroll down to scenario controls ↓</p>
        </div>

        <div className="flex flex-col rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-primary">
            <Presentation className="size-4" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider">Run guided demo</span>
          </div>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            Step through The Degens — Detroit story with narration while the real product updates
            around you.
          </p>
          <Button asChild className="mt-4 h-10 w-full uppercase tracking-wider">
            <Link href="/demo/guided">Run guided demo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

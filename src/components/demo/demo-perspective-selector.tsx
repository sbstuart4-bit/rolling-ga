"use client";

import Link from "next/link";
import { Disc3, Mic2, ShieldCheck } from "lucide-react";
import type { DemoPerspective } from "@/lib/demo-perspective";
import { DEMO_PERSPECTIVE_LABELS } from "@/lib/demo-perspective";
import { cn } from "@/lib/utils";

const PERSPECTIVE_META: Record<
  DemoPerspective,
  { icon: typeof Disc3; description: string }
> = {
  fan: {
    icon: Disc3,
    description: "Live shows, drops, verify, cart, and My Shows.",
  },
  artist: {
    icon: Mic2,
    description: "Artist Studio — tour, merch, drops, and fan CRM.",
  },
  ops: {
    icon: ShieldCheck,
    description: "Cross-artist platform operations and asset QA.",
  },
};

export function DemoPerspectiveSelector({ active }: { active: DemoPerspective }) {
  return (
    <section className="space-y-3">
      <p className="eyebrow text-muted-foreground">Choose perspective</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(PERSPECTIVE_META) as DemoPerspective[]).map((key) => {
          const { icon: Icon, description } = PERSPECTIVE_META[key];
          const isActive = active === key;
          const href = key === "fan" ? "/demo" : `/demo?perspective=${key}`;

          return (
            <Link
              key={key}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col gap-2 rounded-2xl border p-4 text-left transition-colors",
                isActive
                  ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-card hover:border-primary/30",
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full",
                  isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-sm font-semibold uppercase tracking-wider">
                {DEMO_PERSPECTIVE_LABELS[key]}
              </span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

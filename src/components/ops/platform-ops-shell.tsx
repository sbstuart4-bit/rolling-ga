"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Boxes,
  CalendarDays,
  ClipboardCheck,
  Disc3,
  LayoutDashboard,
  Package,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { RollingGaMark } from "@/components/brand/rolling-ga-mark";
import { DemoBoardReturn } from "@/components/demo/demo-board-return";
import { DEMO_ARTIST_LABELS, type DemoArtistKey } from "@/lib/demo-scenario/url";
import { DEMO_ARTISTS } from "@/lib/demo-scenario/types";
import { cn } from "@/lib/utils";

export const PLATFORM_OPS_NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Overview", href: "/ops", icon: LayoutDashboard },
  { label: "Artists", href: "/ops/artists", icon: Users },
  { label: "Shows", href: "/ops/shows", icon: CalendarDays },
  { label: "Drops", href: "/ops/drops", icon: Disc3 },
  { label: "Products", href: "/ops/products", icon: Package },
  { label: "Assets", href: "/ops/assets", icon: ClipboardCheck },
  { label: "Demo / QA", href: "/demo?perspective=ops", icon: Boxes },
];

export function PlatformOpsShell({
  userName,
  demoMode = false,
  children,
}: {
  userName: string;
  demoMode?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewingArtist = searchParams.get("artist");
  const viewingLabel =
    viewingArtist && (DEMO_ARTISTS as readonly string[]).includes(viewingArtist)
      ? DEMO_ARTIST_LABELS[viewingArtist as DemoArtistKey]
      : null;

  return (
    <div className="flex min-h-dvh flex-col bg-[#0c0e12] text-foreground">
      <header className="border-b border-sky-500/20 bg-[#0f1318]">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          <Link href="/ops" aria-label="Rolling GA Ops home">
            <RollingGaMark size="sm" className="text-sky-400/80" />
          </Link>
          <div>
            <span className="text-sm font-semibold tracking-tight">Rolling GA Ops</span>
            <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
              Platform operations
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {demoMode && <DemoBoardReturn variant="link" show />}
            <span className="truncate text-xs text-muted-foreground">{userName}</span>
          </div>
        </div>

        {viewingLabel && (
          <div className="border-t border-sky-500/10 bg-sky-500/5 px-4 py-2 sm:px-6">
            <p className="mx-auto max-w-[1600px] text-xs text-sky-200/90">
              Viewing: <span className="font-semibold">{viewingLabel}</span>
              <span className="ml-2 text-sky-200/50">(operational inspection — not impersonation)</span>
            </p>
          </div>
        )}

        <nav aria-label="Platform operations" className="mx-auto max-w-[1600px] px-4 sm:px-6">
          <ul className="-mb-px flex gap-1 overflow-x-auto no-scrollbar">
            {PLATFORM_OPS_NAV.map((item) => {
              const active =
                item.href === "/ops"
                  ? pathname === "/ops"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "border-sky-400 text-sky-100"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

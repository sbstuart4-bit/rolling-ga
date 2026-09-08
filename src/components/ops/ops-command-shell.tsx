"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ClipboardList, Factory, LayoutDashboard, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { RollingGaMark } from "@/components/brand/rolling-ga-mark";
import { DemoBoardReturn } from "@/components/demo/demo-board-return";
import { cn } from "@/lib/utils";

interface OpsNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const OPS_COMMAND_NAV: OpsNavItem[] = [
  { label: "Command Center", href: "/ops", icon: LayoutDashboard },
  { label: "Production", href: "/ops/production", icon: Factory },
  { label: "Packing", href: "/ops/packing", icon: Package },
  { label: "Orders", href: "/ops/orders", icon: ClipboardList },
  { label: "Exceptions", href: "/ops/exceptions", icon: AlertTriangle },
];

export function OpsCommandShell({
  userName,
  demoMode = false,
  children,
}: {
  userName: string;
  demoMode?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col bg-[#0a0c10] text-white">
      <header className="border-b border-white/10 bg-[#0d1118]">
        <div className="mx-auto flex h-14 max-w-[1728px] items-center gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Rolling GA home" className="flex items-center gap-3">
            <RollingGaMark size="sm" className="text-zinc-400" />
            <span className="text-sm font-semibold tracking-[0.18em] text-zinc-300">ROLLING GA</span>
            <span className="rounded bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">
              Ops
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {demoMode && <DemoBoardReturn variant="link" show />}
            <span className="truncate text-xs text-zinc-500">{userName}</span>
          </div>
        </div>

        <nav aria-label="Rolling GA Ops" className="mx-auto max-w-[1728px] px-4 sm:px-6">
          <ul className="-mb-px flex gap-1 overflow-x-auto no-scrollbar">
            {OPS_COMMAND_NAV.map((item) => {
              const active =
                item.href === "/ops"
                  ? pathname === "/ops" || pathname.startsWith("/ops/shows/")
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
                        ? "border-sky-400 text-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-200",
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

      <main className="mx-auto w-full max-w-[1728px] flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

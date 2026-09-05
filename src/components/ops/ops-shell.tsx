"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  ClipboardList,
  Package,
  Truck,
} from "lucide-react";
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

export const OPS_NAV: OpsNavItem[] = [
  { label: "Events", href: "/ops", icon: CalendarDays },
  { label: "Orders", href: "/ops/orders", icon: ClipboardList },
  { label: "Inventory", href: "/ops/inventory", icon: Boxes },
  { label: "Pick / Pack", href: "/ops/pick-pack", icon: Package },
  { label: "Exceptions", href: "/ops/exceptions", icon: AlertTriangle },
  { label: "Shipments", href: "/ops/shipments", icon: Truck },
];

/** Fulfillment is an operational desk: a dense horizontal tab bar over a wide table area. */
export function OpsShell({
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
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border bg-sidebar">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Rolling GA home">
            <RollingGaMark size="sm" className="text-muted-foreground" />
          </Link>
          <span className="text-sm font-semibold">Fulfillment Operations</span>
          <div className="ml-auto flex items-center gap-3">
            {demoMode && <DemoBoardReturn variant="link" show />}
            <span className="truncate text-xs text-muted-foreground">{userName}</span>
          </div>
        </div>

        <nav aria-label="Fulfillment" className="mx-auto max-w-[1600px] px-4 sm:px-6">
          <ul className="-mb-px flex gap-1 overflow-x-auto no-scrollbar">
            {OPS_NAV.map((item) => {
              const active =
                item.href === "/ops" ? pathname === "/ops" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "border-foreground text-foreground"
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

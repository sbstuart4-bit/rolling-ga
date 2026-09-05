"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Megaphone,
  Package,
  Palette,
  Radio,
  Route,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StudioNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const STUDIO_NAV: StudioNavItem[] = [
  { label: "Live", href: "/studio", icon: Radio, description: "Tonight's show, in real time" },
  { label: "Tour", href: "/studio/tour", icon: Route, description: "Tours, shows and QR codes" },
  { label: "Drops", href: "/studio/drops", icon: Megaphone, description: "Scheduled and flash drops" },
  { label: "Merch", href: "/studio/merch", icon: Boxes, description: "Products, variants, inventory" },
  { label: "Fans", href: "/studio/fans", icon: Users, description: "Consented audience only" },
  { label: "Insights", href: "/studio/insights", icon: BarChart3, description: "Per-attendee economics" },
  { label: "Brand", href: "/studio/brand", icon: Palette, description: "The artist takeover" },
  { label: "Orders", href: "/studio/orders", icon: Package, description: "Sales and fulfillment status" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/studio") {
    return pathname === "/studio" || pathname.startsWith("/studio/live");
  }
  return pathname.startsWith(href);
}

export function StudioNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Artist Studio" className="space-y-0.5">
      {STUDIO_NAV.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

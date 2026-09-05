"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Disc3, Radio, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FanTab {
  label: string;
  href: string;
  icon: LucideIcon;
  match: string[];
}

export const FAN_TABS: FanTab[] = [
  { label: "Live", href: "/", icon: Radio, match: ["/event"] },
  { label: "Drops", href: "/drops", icon: Disc3, match: ["/drop", "/product", "/bundle"] },
  { label: "My Shows", href: "/shows", icon: CalendarDays, match: [] },
  { label: "Profile", href: "/profile", icon: User, match: ["/order"] },
];

function isActive(pathname: string, tab: FanTab): boolean {
  if (tab.href === "/") {
    return pathname === "/" || tab.match.some((m) => pathname.startsWith(m));
  }
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`) || tab.match.some((m) => pathname.startsWith(m));
}

/** Persistent fan navigation — purple active indicator, live pulse when verified at a show. */
export function FanTabBar({ liveVerifiedShow = false }: { liveVerifiedShow?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="z-40 shrink-0 border-t border-border bg-[#121212]/95 backdrop-blur-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {FAN_TABS.map((tab) => {
          const active = isActive(pathname, tab);
          const Icon = tab.icon;
          const showLivePulse = tab.href === "/" && liveVerifiedShow && !active;

          return (
            <li key={tab.href} className="relative flex-1">
              {active && (
                <span
                  className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary"
                  aria-hidden
                />
              )}
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className={cn("size-5", active && "stroke-[2.25]")} aria-hidden />
                  {showLivePulse && (
                    <span
                      className="absolute -right-1 -top-0.5 inline-flex size-2 rounded-full bg-brand-pink status-dot-pulse"
                      aria-label="Live show in progress"
                    />
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

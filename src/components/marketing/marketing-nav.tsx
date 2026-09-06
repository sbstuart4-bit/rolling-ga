"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { RollingGaMark } from "@/components/brand/rolling-ga-mark";
import { ExperienceNovaButton } from "@/components/marketing/experience-nova-cta";
import { MARKETING_NAV } from "@/components/marketing/marketing-fixtures";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { experienceNovaKestrelAction } from "@/server/marketing/demo-entry";
import { cn } from "@/lib/utils";

/**
 * Approved marketing navigation — docs/website-reference.
 * Black bar, centred links on desktop, purple demo pill on the right.
 */
export function MarketingNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-mkt-border bg-mkt-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-[4.75rem] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:h-[5.75rem] lg:gap-10 lg:px-10">
        <Link href="/home" className="shrink-0" aria-label="Rolling GA home">
          <RollingGaMark
            size="xl"
            tone="brand"
            className="uppercase text-mkt-fg lg:font-medium"
          />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex xl:gap-11">
          {MARKETING_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-sm font-semibold uppercase tracking-[0.14em] text-mkt-muted transition-colors hover:text-mkt-fg",
                  active && "text-mkt-fg underline decoration-mkt-purple decoration-2 underline-offset-[0.65rem]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-7 lg:flex xl:gap-8">
          <Link
            href="/sign-in"
            className="text-sm font-semibold uppercase tracking-[0.14em] text-mkt-muted hover:text-mkt-fg"
          >
            Log in
          </Link>
          <form action={experienceNovaKestrelAction}>
            <ExperienceNovaButton compact className="px-6 py-3 text-xs tracking-[0.14em]" />
          </form>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 text-mkt-fg hover:bg-white/10 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="border-mkt-border bg-mkt-bg px-0 text-mkt-fg">
            <SheetHeader className="border-b border-mkt-border px-6 pb-5 pt-1">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <RollingGaMark size="xl" tone="brand" className="uppercase text-mkt-fg" />
            </SheetHeader>
            <div className="flex flex-col gap-8 px-6 py-8">
              <nav aria-label="Primary" className="flex flex-col gap-5">
                {MARKETING_NAV.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className={cn(
                        "mkt-display text-2xl",
                        pathname === item.href ? "text-mkt-fg" : "text-mkt-muted",
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <form action={experienceNovaKestrelAction}>
                <ExperienceNovaButton className="w-full justify-center" />
              </form>
              <SheetClose asChild>
                <Link href="/sign-in" className="text-sm font-semibold uppercase tracking-[0.14em] text-mkt-muted">
                  Log in
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

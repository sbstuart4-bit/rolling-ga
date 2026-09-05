"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { RollingGaMark } from "@/components/brand/rolling-ga-mark";
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
import { cn } from "@/lib/utils";

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav aria-label="Marketing" className={className}>
      {MARKETING_NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground",
              active && "text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MarketingNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#121212]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/home" className="shrink-0" aria-label="Rolling GA home">
          <RollingGaMark size="lg" />
        </Link>

        <NavLinks
          pathname={pathname}
          className="hidden items-center gap-7 md:flex"
        />

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/sign-in"
            className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
          >
            Log in
          </Link>
          <Button asChild className="h-9 rounded-lg px-4 text-xs font-semibold uppercase tracking-[0.16em]">
            <Link href="/pilot">Run a pilot</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#121212] px-0">
            <SheetHeader>
              <SheetTitle className="sr-only">Marketing navigation</SheetTitle>
              <RollingGaMark size="lg" />
            </SheetHeader>
            <div className="flex flex-col gap-5 px-6 pt-4">
              <nav aria-label="Marketing" className="flex flex-col gap-4 text-base">
                {MARKETING_NAV.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={pathname === item.href ? "page" : undefined}
                      className={
                        pathname === item.href
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <SheetClose asChild>
                <Link
                  href="/sign-in"
                  className="text-sm uppercase tracking-[0.16em] text-muted-foreground"
                >
                  Log in
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/pilot"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground"
                >
                  Run a pilot
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";

import { Menu } from "lucide-react";

import { RollingGaHomeLink } from "@/components/brand/rolling-ga-mark";

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



/**

 * Approved marketing navigation — docs/website-reference.

 * Black bar, centred links on desktop, purple demo pill on the right.

 */

export function MarketingNav() {

  const pathname = usePathname();



  return (

    <header className="sticky top-0 z-50 border-b border-mkt-border bg-mkt-bg/90 backdrop-blur-md">

      <div className="mx-auto flex h-[4.75rem] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:h-[5.75rem] lg:gap-10 lg:px-10">

        <RollingGaHomeLink

          className="focus-visible:ring-mkt-purple focus-visible:ring-offset-mkt-bg"

          markClassName="uppercase font-semibold text-mkt-fg lg:font-bold"

          size="xl"

          tone="brand"

        />



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

          <Link

            href="/demo?perspective=artist"

            className="inline-flex items-center justify-center gap-2 rounded-full bg-mkt-purple px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-mkt-purple-fg transition-opacity hover:opacity-90"

          >

            Try the Demo

            <span aria-hidden>&rarr;</span>

          </Link>

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

              <SheetClose asChild>

                <RollingGaHomeLink

                  className="focus-visible:ring-mkt-purple focus-visible:ring-offset-mkt-bg"

                  markClassName="uppercase font-semibold text-mkt-fg"

                  size="xl"

                  tone="brand"

                />

              </SheetClose>

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

              <SheetClose asChild>

                <Link

                  href="/demo?perspective=artist"

                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-mkt-purple px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-mkt-purple-fg"

                >

                  Try the Demo

                  <span aria-hidden>&rarr;</span>

                </Link>

              </SheetClose>

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


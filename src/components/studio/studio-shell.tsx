"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { RollingGaMark } from "@/components/brand/rolling-ga-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { StudioNav } from "./studio-nav";
import { ArtistSwitcher, type StudioArtistOption } from "./artist-switcher";
import { DemoBoardReturn } from "@/components/demo/demo-board-return";
import { cn } from "@/lib/utils";

/**
 * The Studio is desktop and tablet first: a persistent sidebar from `lg`, collapsing to
 * a sheet below that so a tour manager can still use it from a phone backstage.
 */
export function StudioShell({
  artists,
  activeArtistId,
  userName,
  demoMode = false,
  guidedDemoActive = false,
  children,
}: {
  artists: StudioArtistOption[];
  activeArtistId: string | null;
  userName: string;
  demoMode?: boolean;
  guidedDemoActive?: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const activeArtist = artists.find((a) => a.id === activeArtistId) ?? artists[0];

  const sidebar = (
    <div className="flex h-full flex-col gap-6">
      <div className="space-y-1">
        <Link href="/" className="inline-flex" aria-label="Rolling GA home">
          <RollingGaMark size="sm" className="text-muted-foreground" />
        </Link>
        <p className="text-lg font-semibold tracking-tight">Artist Studio</p>
      </div>

      <ArtistSwitcher artists={artists} activeArtistId={activeArtist?.id ?? null} />

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <StudioNav onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="border-t border-sidebar-border pt-4 space-y-2">
        {demoMode && <DemoBoardReturn variant="link" show />}
        <p className="truncate text-xs text-muted-foreground">Signed in as {userName}</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar p-5 lg:block">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open Studio navigation">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-sidebar p-5">
              <SheetHeader className="sr-only">
                <SheetTitle>Artist Studio navigation</SheetTitle>
              </SheetHeader>
              {sidebar}
            </SheetContent>
          </Sheet>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
            {activeArtist?.name ?? "Artist Studio"}
          </span>
          {demoMode && <DemoBoardReturn variant="compact" show />}
        </header>

        <main
          className={cn(
            "min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
            guidedDemoActive && "pb-28 xl:pb-8",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

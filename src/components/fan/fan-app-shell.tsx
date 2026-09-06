import type { ReactNode } from "react";
import { FanHeader } from "@/components/fan/fan-header";
import { FanTabBar } from "@/components/fan/fan-tab-bar";
import { cn } from "@/lib/utils";

/**
 * The fan product is a phone app. On a real device it goes edge-to-edge;
 * on desktop it sits in a 390px device so Live / Drops / My Shows never
 * turn into a website layout.
 */
export function FanAppShell({
  displayName,
  cartCount,
  liveVerifiedShow = false,
  presentation = "default",
  children,
}: {
  displayName: string;
  cartCount: number;
  liveVerifiedShow?: boolean;
  /** Guided demo uses a larger frame and skips the outer desktop chrome wrapper. */
  presentation?: "default" | "guided";
  children: ReactNode;
}) {
  const isGuided = presentation === "guided";

  const device = (
    <div
      className={cn(
        "relative mx-auto flex h-dvh w-full flex-col overflow-hidden bg-background",
        isGuided
          ? "md:h-[min(52rem,calc(100dvh-2rem))] md:w-[428px] md:max-w-[428px] md:rounded-[2.15rem] md:border md:border-zinc-600/80 md:p-2 md:shadow-soft-lg"
          : "max-w-lg md:h-[min(44rem,calc(100dvh-3rem))] md:w-[390px] md:max-w-[390px] md:rounded-[2.15rem] md:border md:border-zinc-600/80 md:p-2 md:shadow-soft-lg",
      )}
    >
      <div className="fan-surface flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-[1.75rem]">
        <div
          className="hidden shrink-0 items-center justify-between px-7 pt-3 text-[11px] font-medium text-muted-foreground md:flex"
          aria-hidden
        >
          <span>9:41</span>
          <span className="h-5 w-24 rounded-full bg-black" />
          <span>5G</span>
        </div>
        <FanHeader displayName={displayName} cartCount={cartCount} />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        <div id="fan-app-dock" className="shrink-0 empty:hidden" />
        <FanTabBar liveVerifiedShow={liveVerifiedShow} />
        <div className="hidden shrink-0 justify-center pb-1.5 pt-0.5 md:flex" aria-hidden>
          <span className="h-1 w-28 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );

  if (isGuided) return device;

  return (
    <div className="min-h-dvh bg-[#070708] md:flex md:items-center md:justify-center md:p-6">
      {device}
    </div>
  );
}

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { RollingGaHomeLink, RollingGaMark } from "@/components/brand/rolling-ga-mark";
import { DemoBoardReturn } from "@/components/demo/demo-board-return";
import { initialsOf } from "@/lib/format";
import { demoModeEnabled } from "@/lib/demo-mode";

export function FanHeader({
  displayName,
  cartCount,
  homeHref = "/",
}: {
  displayName: string;
  cartCount: number;
  /** Marketing homepage when presenting the public guided demo. */
  homeHref?: "/" | "/home";
}) {
  return (
    <header className="z-30 shrink-0 border-b border-border bg-[#121212]/95 pt-safe backdrop-blur-lg">
      <div className="flex h-12 items-center gap-2 px-4">
        {homeHref === "/home" ? (
          <RollingGaHomeLink
            className="min-w-0 flex-1 focus-visible:ring-primary focus-visible:ring-offset-[#121212]"
            markClassName="uppercase font-semibold"
            size="default"
            tone="brand"
          />
        ) : (
          <Link href="/" className="min-w-0 flex-1" aria-label="Rolling GA home">
            <RollingGaMark className="uppercase font-semibold" />
          </Link>
        )}

        <Link
          href="/cart"
          className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart, empty"}
        >
          <ShoppingBag className="size-[18px]" aria-hidden />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
              {cartCount}
            </span>
          )}
        </Link>

        <DemoBoardReturn variant="compact" show={demoModeEnabled()} />

        <Link
          href="/profile"
          className="flex size-8 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-foreground ring-1 ring-border"
          aria-label={`Profile, ${displayName}`}
        >
          {initialsOf(displayName)}
        </Link>
      </div>
    </header>
  );
}

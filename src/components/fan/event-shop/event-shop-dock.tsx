import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { FanAppDock } from "@/components/fan/fan-app-dock";
import { Button } from "@/components/ui/button";

export function EventShopDock({
  cartCount,
  visible,
}: {
  cartCount: number;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <FanAppDock>
      <div className="border-t border-artist-border bg-artist-bg/95 px-4 py-3 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button
            asChild
            variant="outline"
            className="h-11 flex-1 border-artist-border bg-transparent text-artist-fg hover:bg-artist-accent/10"
          >
            <Link href="/cart">
              <ShoppingBag className="size-4" aria-hidden />
              {cartCount > 0 ? `Cart (${cartCount})` : "Cart"}
            </Link>
          </Button>
          {cartCount > 0 && (
            <Button
              asChild
              className="h-11 flex-1 bg-artist-accent font-semibold uppercase tracking-[0.08em] text-artist-accent-fg hover:bg-artist-accent/90"
            >
              <Link href="/checkout">
                Checkout
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </FanAppDock>
  );
}

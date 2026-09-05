import type { CartEventContextRef } from "@/lib/cart-copy";
import { cartPageSubtitle, cartPageTitle } from "@/lib/cart-copy";
import { cn } from "@/lib/utils";

/**
 * Cart masthead — neutral Rolling GA styling with show-aware copy when attributed.
 */
export function CartPageHeader({
  eventContext,
  className,
}: {
  eventContext: CartEventContextRef | null | undefined;
  className?: string;
}) {
  const subtitle = cartPageSubtitle(eventContext);

  return (
    <header
      className={cn(
        "sticky top-0 z-10 border-b border-border bg-background/80 px-5 py-4 backdrop-blur",
        className,
      )}
    >
      <div className="space-y-0.5">
        <h1 className="text-xl font-semibold tracking-tight">{cartPageTitle(eventContext)}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </header>
  );
}

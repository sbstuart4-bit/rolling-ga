import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function BundleUpsellCard({
  bundleName,
  description,
  bundlePriceCents,
  savingsCents,
  itemCount,
  shopHref,
  branded = false,
}: {
  bundleName: string;
  description?: string | null;
  bundlePriceCents: number;
  savingsCents: number;
  itemCount: number;
  shopHref: string;
  branded?: boolean;
}) {
  return (
    <section
      className={cn(
        "space-y-3 rounded-2xl border p-4",
        branded ? "border-artist-accent/30 bg-artist-accent/10" : "border-primary/30 bg-primary/10",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            branded ? "bg-artist-accent/15 text-artist-accent" : "bg-primary/15 text-primary",
          )}
        >
          <Package className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className={cn("eyebrow", branded ? "text-artist-accent" : "text-primary")}>
            Complete your drop
          </p>
          <p className={cn("font-medium", branded && "text-artist-fg")}>{bundleName}</p>
          {description && (
            <p className={cn("text-sm", branded ? "text-artist-muted" : "text-muted-foreground")}>
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className={branded ? "text-artist-muted" : "text-muted-foreground"}>
          {itemCount} pieces · {formatMoney(bundlePriceCents)}
        </span>
        {savingsCents > 0 && (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            Save {formatMoney(savingsCents)}
          </span>
        )}
      </div>

      <Button asChild variant={branded ? "moment" : "default"} size="lg" className="w-full">
        <Link href={shopHref}>View bundle</Link>
      </Button>
    </section>
  );
}

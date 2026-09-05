"use client";

import Link from "next/link";
import { formatDeliveryWindow, formatMoney } from "@/lib/format";
import type { ShippingChoiceView } from "@/lib/shipping-view";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function deliveryEstimateLabel(choice: ShippingChoiceView): string {
  const from = new Date(choice.estimatedDeliveryFrom);
  const to = new Date(choice.estimatedDeliveryTo);

  if (choice.speed === "next_day") {
    return "Estimated next day";
  }

  if (choice.deliveryMinDays === choice.deliveryMaxDays) {
    return `Estimated ${choice.deliveryMinDays} business day${choice.deliveryMinDays === 1 ? "" : "s"}`;
  }

  return `Estimated ${formatDeliveryWindow(from, to)}`;
}

export function ShippingOptionPicker({
  choices,
  selectedId,
  onSelectedChange,
  name = "shippingOptionId",
}: {
  choices: ShippingChoiceView[];
  selectedId: string;
  onSelectedChange: (id: string) => void;
  name?: string;
}) {
  if (choices.length === 0) return null;

  return (
    <RadioGroup
      name={name}
      value={selectedId}
      onValueChange={onSelectedChange}
      className="space-y-2"
    >
      {choices.map((choice) => (
        <label
          key={choice.id}
          htmlFor={`ship-${choice.id}`}
          className={cn(
            "flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent",
            "has-[[aria-checked=true]]:border-primary",
          )}
        >
          <RadioGroupItem id={`ship-${choice.id}`} value={choice.id} className="mt-0.5" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{choice.name}</p>
                <p className="text-xs text-muted-foreground">{choice.speedLabel}</p>
              </div>
              <span className="tabular shrink-0 text-sm font-semibold">
                {choice.customerChargeCents === 0 ? "Free" : formatMoney(choice.customerChargeCents)}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">{deliveryEstimateLabel(choice)}</p>

            {choice.artistSubsidyCents > 0 && (
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Artist covers {formatMoney(choice.artistSubsidyCents)}
              </p>
            )}

            {choice.strategy === "free_above_threshold" &&
              !choice.thresholdMet &&
              choice.freeThresholdCents != null && (
                <p className="text-xs text-muted-foreground">
                  Free on orders over {formatMoney(choice.freeThresholdCents)}
                </p>
              )}
          </div>
        </label>
      ))}
    </RadioGroup>
  );
}

export function ShippingTotalsBreakdown({
  subtotalCents,
  selectedChoice,
  totalCents,
  className,
}: {
  subtotalCents: number;
  selectedChoice: ShippingChoiceView | undefined;
  totalCents: number;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3 rounded-xl border border-border bg-muted/40 p-4 text-sm", className)}>
      <div className="flex justify-between text-muted-foreground">
        <span>Subtotal</span>
        <span className="tabular">{formatMoney(subtotalCents)}</span>
      </div>

      {selectedChoice && (
        <>
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span className="tabular">
              {selectedChoice.customerChargeCents === 0
                ? "Free"
                : formatMoney(selectedChoice.customerChargeCents)}
            </span>
          </div>
          {selectedChoice.artistSubsidyCents > 0 && (
            <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400">
              <span>Artist covers</span>
              <span className="tabular">{formatMoney(selectedChoice.artistSubsidyCents)}</span>
            </div>
          )}
        </>
      )}

      <div className="flex justify-between border-t border-border pt-3 font-semibold">
        <span>Total</span>
        <span className="tabular">{formatMoney(totalCents)}</span>
      </div>
    </section>
  );
}

export function CartShippingPreview({
  choices,
  subtotalCents,
  checkoutHref,
  branded = false,
}: {
  choices: ShippingChoiceView[];
  subtotalCents: number;
  checkoutHref: string;
  branded?: boolean;
}) {
  const lowest = choices.length
    ? Math.min(...choices.map((c) => c.customerChargeCents))
    : null;

  const freeThresholdOption = choices.find(
    (c) => c.strategy === "free_above_threshold" && c.freeThresholdCents != null,
  );
  const thresholdMet = freeThresholdOption?.thresholdMet ?? false;
  const subsidizedOption = choices.find((c) => c.artistSubsidyCents > 0);

  let shippingLabel = "Calculated at checkout";
  if (choices.length > 0 && lowest != null) {
    if (lowest === 0 && choices.every((c) => c.customerChargeCents === 0)) {
      shippingLabel = "Free";
    } else if (lowest === 0) {
      shippingLabel = "From free";
    } else {
      shippingLabel = choices.length > 1 ? `From ${formatMoney(lowest)}` : formatMoney(lowest);
    }
  }

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border p-4",
        branded ? "border-artist-border bg-artist-surface" : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between text-sm">
        <span className={branded ? "text-artist-muted" : "text-muted-foreground"}>Subtotal</span>
        <span className={cn("tabular font-medium", branded && "text-artist-fg")}>
          {formatMoney(subtotalCents)}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className={branded ? "text-artist-muted" : "text-muted-foreground"}>Shipping</span>
        <span className={cn("tabular font-medium", branded && "text-artist-fg")}>{shippingLabel}</span>
      </div>

      {freeThresholdOption && !thresholdMet && freeThresholdOption.freeThresholdCents != null && (
        <p className={cn("text-xs", branded ? "text-artist-muted" : "text-muted-foreground")}>
          Free shipping on orders over {formatMoney(freeThresholdOption.freeThresholdCents)}
          {subtotalCents > 0 && (
            <> — add {formatMoney(freeThresholdOption.freeThresholdCents - subtotalCents)} more</>
          )}
        </p>
      )}

      {subsidizedOption && subsidizedOption.artistSubsidyCents > 0 && (
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          Artist may cover up to {formatMoney(subsidizedOption.artistSubsidyCents)} on select methods
        </p>
      )}

      <Button
        asChild
        size="lg"
        variant={branded ? "moment" : "default"}
        className={cn("mt-2 w-full text-base font-semibold", !branded && "h-14")}
      >
        <Link href={checkoutHref}>
          {branded ? "Get my drop" : "Continue to checkout"} · {formatMoney(subtotalCents)}
        </Link>
      </Button>
    </div>
  );
}

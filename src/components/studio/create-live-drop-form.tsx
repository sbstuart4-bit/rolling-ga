"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Zap } from "lucide-react";
import { DropFanPreview } from "@/components/studio/drop-fan-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/format";
import type { ResolvedTheme } from "@/lib/theme";
import { createLiveDropAction, type LiveDropState } from "@/server/studio/drop-actions";

function formatCountdown(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

export function CreateLiveDropForm({
  artistId,
  eventId,
  city,
  theme,
  heroImage,
  products,
  defaultEndsAtIso,
}: {
  artistId: string;
  eventId: string;
  city: string;
  theme: ResolvedTheme;
  heroImage: string | null;
  products: { id: string; name: string; basePriceCents: number; images: string[] | null }[];
  defaultEndsAtIso: string;
}) {
  const [state, action, pending] = useActionState<LiveDropState, FormData>(createLiveDropAction, {});
  const [editing, setEditing] = React.useState(false);
  const [lastPreview, setLastPreview] = React.useState(state.preview);

  const [productId, setProductId] = React.useState(products[0]?.id ?? "");
  const [dropPriceCents, setDropPriceCents] = React.useState(
    String((products[0]?.basePriceCents ?? 5500) / 100),
  );
  const [quantityLimit, setQuantityLimit] = React.useState("500");
  const [startMode, setStartMode] = React.useState<"now" | "scheduled">("now");
  const [scheduledStartsAt, setScheduledStartsAt] = React.useState("");
  const [durationMode, setDurationMode] = React.useState<"minutes" | "until_post_show_close">(
    "minutes",
  );
  const [durationMinutes, setDurationMinutes] = React.useState("45");

  if (lastPreview !== state.preview) {
    setLastPreview(state.preview);
    setEditing(false);
  }

  const preview = editing ? undefined : state.preview;
  const selectedProduct = products.find((product) => product.id === productId) ?? products[0];
  const previewPriceCents = preview?.dropPriceCents ?? Math.round(Number(dropPriceCents) * 100);
  const previewProductName = preview?.productName ?? selectedProduct?.name ?? "Drop product";
  const durationMinutesNumber = Number(durationMinutes) || 45;
  const computedEndIso = preview?.endsAtIso ?? defaultEndsAtIso;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
      <form action={action} className="space-y-6 rounded-2xl border border-border bg-card/40 p-6">
        <input type="hidden" name="artistId" value={artistId} />
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="exclusivityType" value="encore" />

        {preview ? (
          <>
            <LiveDropConfirm preview={preview} city={city} onEdit={() => setEditing(true)} />
            <input type="hidden" name="productId" value={preview.productId} />
            <input type="hidden" name="dropPriceCents" value={String(preview.dropPriceCents)} />
            {preview.quantityLimit ? (
              <input type="hidden" name="quantityLimit" value={String(preview.quantityLimit)} />
            ) : null}
            <input type="hidden" name="startMode" value={startMode} />
            {scheduledStartsAt ? (
              <input type="hidden" name="scheduledStartsAt" value={scheduledStartsAt} />
            ) : null}
            <input type="hidden" name="durationMode" value={durationMode} />
            <input type="hidden" name="durationMinutes" value={durationMinutes} />
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="productId">Product</Label>
              <Select
                name="productId"
                value={productId}
                onValueChange={(value) => {
                  setProductId(value);
                  const product = products.find((row) => row.id === value);
                  if (product) setDropPriceCents(String(product.basePriceCents / 100));
                }}
              >
                <SelectTrigger id="productId" className="h-11">
                  <SelectValue placeholder="Select merchandise" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Audience: Verified attendees of this show
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="quantityLimit">Quantity</Label>
                <Input
                  id="quantityLimit"
                  name="quantityLimit"
                  type="number"
                  min={1}
                  value={quantityLimit}
                  onChange={(event) => setQuantityLimit(event.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dropPriceDisplay">Price (USD)</Label>
                <Input
                  id="dropPriceDisplay"
                  type="number"
                  min={0}
                  step="0.01"
                  value={dropPriceCents}
                  onChange={(event) => setDropPriceCents(event.target.value)}
                  className="h-11"
                />
                <input
                  type="hidden"
                  name="dropPriceCents"
                  value={String(Math.round(Number(dropPriceCents) * 100))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startMode">Start</Label>
                <Select
                  name="startMode"
                  value={startMode}
                  onValueChange={(value) => setStartMode(value as "now" | "scheduled")}
                >
                  <SelectTrigger id="startMode" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">Now</SelectItem>
                    <SelectItem value="scheduled">Scheduled time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {startMode === "scheduled" && (
                <div className="space-y-1.5">
                  <Label htmlFor="scheduledStartsAt">Scheduled start</Label>
                  <Input
                    id="scheduledStartsAt"
                    name="scheduledStartsAt"
                    type="datetime-local"
                    value={scheduledStartsAt}
                    onChange={(event) => setScheduledStartsAt(event.target.value)}
                    className="h-11"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="durationMode">Duration</Label>
                <Select
                  name="durationMode"
                  value={durationMode}
                  onValueChange={(value) =>
                    setDurationMode(value as "minutes" | "until_post_show_close")
                  }
                >
                  <SelectTrigger id="durationMode" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Fixed minutes</SelectItem>
                    <SelectItem value="until_post_show_close">Until post-show close</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {durationMode === "minutes" && (
                <div className="space-y-1.5">
                  <Label htmlFor="durationMinutes">Minutes</Label>
                  <Select
                    name="durationMinutes"
                    value={durationMinutes}
                    onValueChange={setDurationMinutes}
                  >
                    <SelectTrigger id="durationMinutes" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Ends approximately{" "}
              <time dateTime={computedEndIso}>{new Date(computedEndIso).toLocaleString()}</time>
            </p>
          </>
        )}

        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}

        {preview ? (
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(true)}>
              Back to edit
            </Button>
            <Button
              type="submit"
              name="confirm"
              value="true"
              className="flex-1 bg-[color:var(--studio-live,#e879f9)] text-black hover:opacity-90"
              disabled={pending}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : (
                <>
                  <Zap className="size-4" aria-hidden />
                  Launch drop
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button type="submit" name="confirm" value="false" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Review before launch"}
          </Button>
        )}
      </form>

      <DropFanPreview
        theme={theme}
        city={city}
        productName={previewProductName}
        priceCents={previewPriceCents}
        countdownLabel={formatCountdown(durationMinutesNumber)}
        exclusivityLabel={`Verified ${city} attendees only`}
        heroImage={selectedProduct?.images?.[0] ?? heroImage}
      />
    </div>
  );
}

function LiveDropConfirm({
  preview,
  city,
  onEdit,
}: {
  preview: NonNullable<LiveDropState["preview"]>;
  city: string;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5">
      <div>
        <p className="eyebrow text-violet-300">Ready to launch?</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">{preview.productName}</h2>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Eligible fans</dt>
          <dd className="font-semibold tabular">{preview.eligibleFanCount.toLocaleString("en-US")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Available</dt>
          <dd className="font-semibold tabular">{preview.quantityLimit?.toLocaleString("en-US") ?? "Uncapped"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Duration</dt>
          <dd className="font-semibold">{preview.durationLabel}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Price</dt>
          <dd className="font-semibold tabular">{formatMoney(preview.dropPriceCents)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Audience</dt>
          <dd className="font-semibold">Verified {city} attendees</dd>
        </div>
      </dl>
      <button type="button" onClick={onEdit} className="text-sm text-muted-foreground underline">
        Back to edit
      </button>
    </div>
  );
}

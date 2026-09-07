"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertCircle, Check, Loader2, Zap } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { createFlashDropAction, type FlashDropState } from "@/server/studio/drop-actions";
import { formatEventDate } from "@/lib/format";

/**
 * Two-step flash drop creation.
 *
 * Step 1: the artist fills in the form and submits it for review, which validates
 * everything server-side without writing anything.
 * Step 2: the reviewed configuration is carried back in hidden fields and publishing
 * requires a second, explicit submission. An accidental submit can only ever reach the
 * preview.
 *
 * Which step a submission means is carried by the submit button's own name and value,
 * so it is decided by the button the artist actually pressed.
 */
export function CreateFlashDropForm({
  artistId,
  events,
  products,
  defaults,
}: {
  artistId: string;
  events: { id: string; slug: string; startsAt: Date; timezone: string; venueCity: string; artistName: string }[];
  products: { id: string; name: string; basePriceCents: number }[];
  defaults?: {
    title?: string;
    description?: string;
    eventId?: string;
    durationMinutes?: string;
    productIds?: string[];
  };
}) {
  const [state, action, pending] = useActionState<FlashDropState, FormData>(
    createFlashDropAction,
    {},
  );

  // "Edit" returns to the form without discarding the server's preview. Each server
  // response is a new object, so a fresh preview clears the editing flag.
  const [editing, setEditing] = React.useState(false);
  const [lastPreview, setLastPreview] = React.useState(state.preview);
  if (lastPreview !== state.preview) {
    setLastPreview(state.preview);
    setEditing(false);
  }

  const preview = editing ? undefined : state.preview;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="artistId" value={artistId} />

      {preview ? (
        <>
          <ConfirmPreview preview={preview} events={events} />
          {/* Carries the reviewed configuration into the confirming submission. The
              server re-validates all of it regardless. */}
          <input type="hidden" name="title" value={preview.title} />
          {preview.description && (
            <input type="hidden" name="description" value={preview.description} />
          )}
          <input type="hidden" name="eventId" value={preview.eventId} />
          <input type="hidden" name="durationMinutes" value={preview.durationMinutes} />
          {preview.productIds.map((productId) => (
            <input key={productId} type="hidden" name="productIds" value={productId} />
          ))}
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="title">Drop title</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={defaults?.title}
              placeholder="e.g. 48-Hour Brooklyn Encore Drop"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              name="description"
              defaultValue={defaults?.description}
              placeholder="A quick line about this drop"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eventId">Show</Label>
            <Select name="eventId" required defaultValue={defaults?.eventId}>
              <SelectTrigger id="eventId" className="h-11">
                <SelectValue placeholder="Select a show" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.artistName} — {e.venueCity} ({formatEventDate(e.startsAt, e.timezone)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="durationMinutes">How long does it run?</Label>
            <Select name="durationMinutes" defaultValue={defaults?.durationMinutes ?? "60"}>
              <SelectTrigger id="durationMinutes" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
                <SelectItem value="480">8 hours</SelectItem>
                <SelectItem value="2880">48 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Products in this drop</legend>
            <ul className="space-y-2">
              {products.map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-accent has-[:checked]:border-primary">
                    <Checkbox
                      name="productIds"
                      value={p.id}
                      defaultChecked={defaults?.productIds?.includes(p.id)}
                    />
                    <span className="flex-1 text-sm font-medium">{p.name}</span>
                    <span className="tabular text-sm text-muted-foreground">
                      ${(p.basePriceCents / 100).toFixed(0)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        </>
      )}

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </div>
      )}

      {preview ? (
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
          <Button
            type="submit"
            name="confirm"
            value="true"
            className="flex-1 bg-success text-success-foreground hover:bg-success/90"
            disabled={pending}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : (
              <>
                <Zap className="size-4" aria-hidden />
                Publish flash drop
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button
          type="submit"
          name="confirm"
          value="false"
          size="lg"
          className="w-full"
          disabled={pending}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Preview before publishing"}
        </Button>
      )}
    </form>
  );
}

function ConfirmPreview({
  preview,
  events,
}: {
  preview: NonNullable<FlashDropState["preview"]>;
  events: { id: string; venueCity: string; startsAt: Date; timezone: string }[];
}) {
  const event = events.find((e) => e.id === preview.eventId);

  return (
    <div className="rounded-2xl border border-success/40 bg-success/10 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
        <div>
          <p className="font-semibold text-foreground">Ready to go live</p>
          <p className="text-sm text-muted-foreground">Review the details and confirm to publish.</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="eyebrow text-muted-foreground">Drop name</dt>
          <dd className="font-medium">{preview.title}</dd>
        </div>
        {event && (
          <div>
            <dt className="eyebrow text-muted-foreground">Show</dt>
            <dd className="font-medium">{event.venueCity}</dd>
          </div>
        )}
        <div>
          <dt className="eyebrow text-muted-foreground">Duration</dt>
          <dd className="font-medium">
            {preview.durationMinutes < 60
              ? `${preview.durationMinutes} min`
              : `${preview.durationMinutes / 60} hr`}
          </dd>
        </div>
        <div>
          <dt className="eyebrow text-muted-foreground">Products</dt>
          <dd className="font-medium">{preview.productCount}</dd>
        </div>
      </dl>
    </div>
  );
}

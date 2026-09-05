"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
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
import { SHIPPING_STRATEGIES } from "@/lib/types";
import { updateTourDefaultsAction, type TourActionState } from "@/server/studio/tour-actions";

export function TourDefaultsForm({
  artistId,
  tour,
}: {
  artistId: string;
  tour: {
    id: string;
    name: string;
    showMessaging: string | null;
    artworkUrl: string | null;
    logoUrl: string | null;
    heroImageUrl: string | null;
    accent: string | null;
    background: string | null;
    postShowWindowMinutes: number;
    shippingStrategy: string;
  };
}) {
  const [state, action, pending] = useActionState<TourActionState, FormData>(
    updateTourDefaultsAction,
    {},
  );

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-border bg-card/40 p-6">
      <input type="hidden" name="tourId" value={tour.id} />
      <input type="hidden" name="artistId" value={artistId} />

      <div className="space-y-1.5">
        <Label htmlFor="name">Tour name</Label>
        <Input id="name" name="name" defaultValue={tour.name} required className="h-11" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tour artwork URL" name="artworkUrl" defaultValue={tour.artworkUrl ?? ""} />
        <Field label="Logo URL" name="logoUrl" defaultValue={tour.logoUrl ?? ""} />
        <Field label="Hero image URL" name="heroImageUrl" defaultValue={tour.heroImageUrl ?? ""} />
        <Field label="Accent color" name="accent" defaultValue={tour.accent ?? ""} />
        <Field label="Background color" name="background" defaultValue={tour.background ?? ""} />
        <Field label="Tour message" name="showMessaging" defaultValue={tour.showMessaging ?? ""} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="postShowWindowMinutes">Post-show commerce duration (minutes)</Label>
          <Input
            id="postShowWindowMinutes"
            name="postShowWindowMinutes"
            type="number"
            defaultValue={tour.postShowWindowMinutes}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shippingStrategy">Default shipping strategy</Label>
          <Select name="shippingStrategy" defaultValue={tour.shippingStrategy}>
            <SelectTrigger id="shippingStrategy" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHIPPING_STRATEGIES.map((strategy) => (
                <SelectItem key={strategy} value={strategy}>
                  {strategy.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-400">Tour defaults saved.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Save tour defaults"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue} className="h-11" />
    </div>
  );
}

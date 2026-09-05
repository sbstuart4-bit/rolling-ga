"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTourAction, type TourActionState } from "@/server/studio/tour-actions";

export function CreateTourForm({ artistId }: { artistId: string }) {
  const [state, action, pending] = useActionState<TourActionState, FormData>(
    createTourAction,
    {},
  );

  return (
    <form action={action} className="mx-auto max-w-lg space-y-5 rounded-2xl border border-border bg-card/40 p-6">
      <input type="hidden" name="artistId" value={artistId} />
      <div className="space-y-1.5">
        <Label htmlFor="name">Tour name</Label>
        <Input id="name" name="name" placeholder="Nightfall World Tour 2027" required className="h-11" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="year">Year (optional)</Label>
        <Input id="year" name="year" type="number" placeholder="2027" className="h-11" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Create tour"}
      </Button>
    </form>
  );
}

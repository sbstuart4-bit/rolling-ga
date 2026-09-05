"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { addBundleToCartAction, type CartActionState } from "@/server/commerce/actions";

export function AddBundleToCartButton({
  bundleId,
  artistId,
  eventId,
  eventSlug,
}: {
  bundleId: string;
  artistId: string;
  eventId: string;
  eventSlug: string;
}) {
  const [state, action, pending] = useActionState<CartActionState, FormData>(
    addBundleToCartAction,
    {},
  );

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="bundleId" value={bundleId} />
      <input type="hidden" name="artistId" value={artistId} />
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="eventSlug" value={eventSlug} />
      <Button type="submit" variant="moment" size="lg" className="w-full" disabled={pending}>
        {pending ? "Adding…" : "Add bundle to cart"}
      </Button>
      {state.error && <p className="text-center text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

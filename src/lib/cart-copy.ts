/** Minimal event attribution used for cart copy — matches CommerceEventContext shape. */
export interface CartEventContextRef {
  eventId: string;
  eventSlug: string;
  artistId: string;
  artistName: string;
  venueName: string;
  venueCity: string;
  startsAt: Date;
  timezone: string;
}

/** Page title for the fan cart surface. */
export function cartPageTitle(eventContext: CartEventContextRef | null | undefined): string {
  return eventContext ? "My Drop" : "Cart";
}

/** Supporting line beneath the cart title when shopping from a show. */
export function cartPageSubtitle(eventContext: CartEventContextRef | null | undefined): string | null {
  if (!eventContext) return null;
  return "Your selections from tonight\u2019s experience";
}

/** Document title for cart routes. */
export function cartMetadataTitle(eventContext: CartEventContextRef | null | undefined): string {
  return eventContext ? "My Drop \u2014 Rolling GA" : "Cart \u2014 Rolling GA";
}

import "server-only";
import type { CommerceEventContext } from "@/server/commerce/attribution";
import { loadEventPage, type EventPageContext } from "./context";

/** Resolves full event page context for commerce surfaces that only hold attribution. */
export async function loadEventPageFromCommerceContext(
  context: CommerceEventContext | null | undefined,
  userId: string,
): Promise<EventPageContext | null> {
  if (!context) return null;
  return loadEventPage(context.eventSlug, userId);
}

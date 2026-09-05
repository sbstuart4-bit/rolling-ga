/**
 * Commerce attribution for verified fan relationships.
 *
 * A purchase is only attributed to a show when existing order/drop/event data
 * proves the connection. Fan verified at Detroit + generic artist purchase later
 * remains unattributed to Detroit.
 */

export type CommerceAttributionPhase = "show_night" | "post_show" | "unattributed";

export interface OrderAttributionInput {
  orderId: string;
  orderEventId: string | null;
  placedAt: Date | null;
  commerceSource: string;
  lines: {
    dropId: string | null;
    dropEventId: string | null;
    lineTotalCents: number;
  }[];
}

export interface EventWindow {
  eventId: string;
  startsAt: Date;
  endsAt: Date;
  postShowClosesAt: Date | null;
}

export interface AttributedOrderLine {
  orderId: string;
  placedAt: Date | null;
  lineTotalCents: number;
  phase: CommerceAttributionPhase;
  /** Event that earned attribution, if any */
  attributedEventId: string | null;
}

const MS_DAY = 86_400_000;

/** Whether an order line can be attributed to a specific show for a verified fan. */
export function attributeOrderToEvent(
  order: OrderAttributionInput,
  event: EventWindow,
  fanVerifiedEventIds: Set<string>,
): AttributedOrderLine[] {
  if (!fanVerifiedEventIds.has(event.eventId)) {
    return order.lines.map((line) => ({
      orderId: order.orderId,
      placedAt: order.placedAt,
      lineTotalCents: line.lineTotalCents,
      phase: "unattributed" as const,
      attributedEventId: null,
    }));
  }

  const results: AttributedOrderLine[] = [];

  for (const line of order.lines) {
    const provableEventId = resolveProvenEventId(order, line, event.eventId, fanVerifiedEventIds);

    if (provableEventId !== event.eventId) {
      results.push({
        orderId: order.orderId,
        placedAt: order.placedAt,
        lineTotalCents: line.lineTotalCents,
        phase: "unattributed",
        attributedEventId: null,
      });
      continue;
    }

    const phase = classifyPhase(order.placedAt, event);
    results.push({
      orderId: order.orderId,
      placedAt: order.placedAt,
      lineTotalCents: line.lineTotalCents,
      phase,
      attributedEventId: event.eventId,
    });
  }

  return results;
}

function resolveProvenEventId(
  order: OrderAttributionInput,
  line: OrderAttributionInput["lines"][number],
  cohortEventId: string,
  fanVerifiedEventIds: Set<string>,
): string | null {
  if (!fanVerifiedEventIds.has(cohortEventId)) return null;

  if (line.dropEventId === cohortEventId) return cohortEventId;

  if (order.orderEventId === cohortEventId) {
    if (order.commerceSource === "event_scoped" || line.dropId != null) {
      return cohortEventId;
    }
  }

  return null;
}

/** Resolve which verified event a line belongs to, if any. Each line attributes to at most one show. */
export function resolveLineEventAttribution(
  order: OrderAttributionInput,
  line: OrderAttributionInput["lines"][number],
  fanVerifiedEventIds: Set<string>,
): string | null {
  if (line.dropEventId && fanVerifiedEventIds.has(line.dropEventId)) {
    return line.dropEventId;
  }

  if (order.orderEventId && fanVerifiedEventIds.has(order.orderEventId)) {
    if (order.commerceSource === "event_scoped" || line.dropId != null) {
      return order.orderEventId;
    }
  }

  return null;
}

function classifyPhase(placedAt: Date | null, event: EventWindow): CommerceAttributionPhase {
  if (!placedAt) return "unattributed";
  const t = placedAt.getTime();
  if (t >= event.startsAt.getTime() && t <= event.endsAt.getTime()) return "show_night";
  if (event.postShowClosesAt && t <= event.postShowClosesAt.getTime()) return "post_show";
  if (t > event.endsAt.getTime()) return "post_show";
  if (t < event.startsAt.getTime()) return "unattributed";
  return "post_show";
}

/** Sum line revenue by phase for a cohort event. */
export function sumAttributedGmv(
  attributed: AttributedOrderLine[],
  phase?: CommerceAttributionPhase,
): number {
  return attributed
    .filter((line) => line.attributedEventId != null && (phase == null || line.phase === phase))
    .reduce((sum, line) => sum + line.lineTotalCents, 0);
}

export function isWithinDaysAfterEvent(
  placedAt: Date | null,
  eventEndsAt: Date,
  days: number,
): boolean {
  if (!placedAt) return false;
  const windowEnd = eventEndsAt.getTime() + days * MS_DAY;
  return placedAt.getTime() > eventEndsAt.getTime() && placedAt.getTime() <= windowEnd;
}

export function postShowGmvWithinWindow(
  attributed: AttributedOrderLine[],
  eventEndsAt: Date,
  days: number,
): number {
  return attributed
    .filter(
      (line) =>
        line.phase === "post_show" &&
        line.attributedEventId != null &&
        isWithinDaysAfterEvent(line.placedAt, eventEndsAt, days),
    )
    .reduce((sum, line) => sum + line.lineTotalCents, 0);
}

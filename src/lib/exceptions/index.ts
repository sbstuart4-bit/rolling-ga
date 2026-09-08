export * from "./types";
export * from "./priority";
export * from "./actions";
export * from "./return-to-flow";

export function opsExceptionHref(exceptionId: string, filter?: string): string {
  const base = `/ops/exceptions/${exceptionId}`;
  return filter ? `${base}?from=${filter}` : base;
}

export function opsExceptionsHref(filter?: string, eventId?: string): string {
  const params = new URLSearchParams();
  if (filter) params.set("filter", filter);
  if (eventId) params.set("event", eventId);
  const qs = params.toString();
  return qs ? `/ops/exceptions?${qs}` : "/ops/exceptions";
}

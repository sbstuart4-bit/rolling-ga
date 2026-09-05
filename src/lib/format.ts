/** Money is stored as integer cents everywhere; this is the only place it becomes a string. */
export function formatMoney(cents: number | null | undefined, currency = "USD"): string {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMoneyExact(cents: number | null | undefined, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents ?? 0) / 100);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatPercent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

/**
 * Dates are rendered in the venue's timezone, not the reader's, so a fan in another
 * city still sees the show's own local date.
 */
export function formatEventDate(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(date);
}

export function formatEventDateShort(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(date);
}

/** Stamp-style date for product metadata strips — e.g. 09.12.27 */
export function formatEventDateStamp(date: Date, timeZone?: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    timeZone,
  }).formatToParts(date);

  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const year = parts.find((part) => part.type === "year")?.value ?? "00";
  return `${month}.${day}.${year}`;
}

export function formatEventTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(date);
}

export function formatDateTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

/** `42:18` for under an hour, `07:42:18` beyond it. Used by every countdown. */
export function formatCountdown(msRemaining: number): string {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function formatDeliveryWindow(from: Date | null, to: Date | null): string {
  if (!from && !to) return "Estimate available once the order is allocated";
  if (from && to) {
    const sameMonth = from.getMonth() === to.getMonth();
    const fromLabel = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(from);
    const toLabel = new Intl.DateTimeFormat("en-US", {
      month: sameMonth ? undefined : "short",
      day: "numeric",
    }).format(to);
    return `${fromLabel} – ${toLabel}`;
  }
  return formatEventDateShort((from ?? to) as Date);
}

export function relativeDayLabel(date: Date, now = new Date()): string {
  const dayMs = 24 * 60 * 60 * 1000;
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(date) - startOf(now)) / dayMs);

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days < 7) return `In ${days} days`;
  if (days < -1 && days > -7) return `${Math.abs(days)} days ago`;
  return formatEventDateShort(date);
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

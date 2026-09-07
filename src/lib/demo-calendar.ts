/** Demo timeline year — every seeded show lands on this calendar. */
export const DEMO_YEAR = 2026;

/** Demo clock always resets to June 1 at 9:00 AM local. */
export const DEMO_ANCHOR_MONTH = 6;
export const DEMO_ANCHOR_DAY = 1;

/** Flagship demo show on the seeded calendar — Marisol Reyes at Brooklyn. */
export const DEMO_SHOW_MONTH = 6;
export const DEMO_SHOW_DAY = 12;

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

/** June 1 → ~August 29 — enough room after the June 30 show. */
export const DEMO_CLOCK_MAX_DAYS = 90;
export const DEMO_CLOCK_RANGE_MS = DEMO_CLOCK_MAX_DAYS * DAY_MS;
export const DEMO_CLOCK_MAX_HOURS = 23;
/** Room before the June 1 anchor for T-30 / early pre-show phases. */
export const DEMO_CLOCK_MIN_OFFSET_MS = -31 * DAY_MS;

export function demoAnchorDate(): Date {
  return new Date(DEMO_YEAR, DEMO_ANCHOR_MONTH - 1, DEMO_ANCHOR_DAY, 9, 0, 0, 0);
}

export function demoShowDate(): Date {
  return new Date(DEMO_YEAR, DEMO_SHOW_MONTH - 1, DEMO_SHOW_DAY, 20, 0, 0, 0);
}

/** Flagship demo show slug — Marisol Reyes at Brooklyn on the seeded calendar. */
export function demoMarisolBrooklynEventSlug(): string {
  return `marisol-reyes-a-tender-night-brooklyn-${DEMO_YEAR}`;
}

/** @deprecated Use demoMarisolBrooklynEventSlug — legacy Nova Nashville slug. */
export function demoNovaNashvilleEventSlug(): string {
  return `nova-kestrel-gold-hour-nashville-${DEMO_YEAR}`;
}

/** @deprecated Use demoNovaNashvilleEventSlug — kept for Degens-specific walkthroughs. */
export function demoDetroitEventSlug(): string {
  return `the-degens-signal-decay-detroit-${DEMO_YEAR}`;
}

/** Builds a timestamp on the demo calendar (month is 1–12). */
export function demoCalendarDate(
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  year = DEMO_YEAR,
): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function offsetToDaysAndHours(offsetMs: number): { days: number; hours: number } {
  const clamped = Math.max(
    DEMO_CLOCK_MIN_OFFSET_MS,
    Math.min(offsetMs, DEMO_CLOCK_RANGE_MS),
  );
  const sign = clamped < 0 ? -1 : 1;
  const abs = Math.abs(clamped);
  const days = sign * Math.floor(abs / DAY_MS);
  const hours = Math.floor((abs % DAY_MS) / HOUR_MS);
  return { days, hours };
}

export function daysAndHoursToOffset(days: number, hours: number): number {
  const sign = days < 0 ? -1 : 1;
  const absDays = Math.abs(days);
  const raw = sign * (absDays * DAY_MS + hours * HOUR_MS);
  return Math.max(DEMO_CLOCK_MIN_OFFSET_MS, Math.min(DEMO_CLOCK_RANGE_MS, raw));
}

/** Offset from the June 1 anchor to a timestamp on the demo calendar. */
export function demoClockOffsetForDate(date: Date): number {
  const offset = date.getTime() - demoAnchorDate().getTime();
  return Math.max(DEMO_CLOCK_MIN_OFFSET_MS, Math.min(DEMO_CLOCK_RANGE_MS, offset));
}

export function demoClockDaysAndHoursForDate(date: Date): { days: number; hours: number } {
  return offsetToDaysAndHours(demoClockOffsetForDate(date));
}

/** Marisol Brooklyn — doors open, verification window, and live set (seeded show times). */
export function demoMarisolBrooklynDoorsOpen(): { days: number; hours: number } {
  return demoClockDaysAndHoursForDate(demoCalendarDate(DEMO_SHOW_MONTH, DEMO_SHOW_DAY, 18, 0));
}

export function demoMarisolBrooklynLive(): { days: number; hours: number } {
  return demoClockDaysAndHoursForDate(demoCalendarDate(DEMO_SHOW_MONTH, DEMO_SHOW_DAY, 20, 0));
}

export function demoMarisolBrooklynPostShow(): { days: number; hours: number } {
  return demoClockDaysAndHoursForDate(demoCalendarDate(DEMO_SHOW_MONTH, DEMO_SHOW_DAY, 22, 30));
}

/** Nova Nashville — doors open, verification window, and live set (seeded show times). */
export function demoNovaNashvilleDoorsOpen(): { days: number; hours: number } {
  return demoClockDaysAndHoursForDate(demoCalendarDate(DEMO_SHOW_MONTH, DEMO_SHOW_DAY, 17, 0));
}

export function demoNovaNashvilleLive(): { days: number; hours: number } {
  return demoClockDaysAndHoursForDate(demoCalendarDate(DEMO_SHOW_MONTH, DEMO_SHOW_DAY, 20, 0));
}

export function demoNovaNashvillePostShow(): { days: number; hours: number } {
  return demoClockDaysAndHoursForDate(demoCalendarDate(DEMO_SHOW_MONTH, DEMO_SHOW_DAY, 22, 30));
}

/** The Degens Detroit — doors open, verification window, and live set (seeded show times). */
export function demoDetroitDoorsOpen(): { days: number; hours: number } {
  return demoClockDaysAndHoursForDate(demoCalendarDate(6, 30, 17, 0));
}

export function demoDetroitLive(): { days: number; hours: number } {
  return demoClockDaysAndHoursForDate(demoCalendarDate(6, 30, 20, 0));
}

export function demoDetroitPostShow(): { days: number; hours: number } {
  return demoClockDaysAndHoursForDate(demoCalendarDate(6, 30, 23, 30));
}

/** Day index on the demo clock when the flagship show plays (Marisol · Brooklyn · June 12). */
export function demoShowDayIndex(): number {
  return demoMarisolBrooklynLive().days;
}

const DEMO_CLOCK_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const DEMO_CLOCK_TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

/** Calendar date at a demo clock day/hour offset from the June 1 anchor. */
export function demoClockDateAt(days: number, hours: number): Date {
  const sign = days < 0 ? -1 : 1;
  const absDays = Math.abs(days);
  return new Date(
    demoAnchorDate().getTime() + sign * (absDays * DAY_MS + hours * HOUR_MS),
  );
}

export function formatDemoClockDate(days: number, hours: number): string {
  return DEMO_CLOCK_DATE_FMT.format(demoClockDateAt(days, hours));
}

export function formatDemoClockTime(hours: number): string {
  return DEMO_CLOCK_TIME_FMT.format(demoClockDateAt(0, hours));
}

export function formatDemoClockPosition(days: number, hours: number): string {
  return `${formatDemoClockDate(days, hours)} · ${formatDemoClockTime(hours)}`;
}

export function isDemoShowNight(days: number, hours: number): boolean {
  const pos = demoClockDateAt(days, hours);
  const show = demoShowDate();
  return (
    pos.getFullYear() === show.getFullYear() &&
    pos.getMonth() === show.getMonth() &&
    pos.getDate() === show.getDate()
  );
}

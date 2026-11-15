const DAY_MS = 24 * 60 * 60 * 1000;

const TIMELINE_MONTHS = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May.', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];

/** Parses `YYYY-MM-DD` (as local midnight) or a full ISO timestamp. */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const safe = value.includes('T') ? value : `${value}T00:00:00`;
  const date = new Date(safe);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfDay(value: string): Date | null {
  const d = parseDate(value);
  return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0) : null;
}

export function endOfDay(value: string): Date | null {
  const d = parseDate(value);
  return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999) : null;
}

/** Formats a Date as a local `YYYY-MM-DD` key. */
export function formatDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Strips any time component from an ISO string. */
export function toDateKey(value: string): string {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value;
}

/** Whole calendar days from `from` to `to`, independent of DST shifts. */
export function diffInDays(from: Date, to: Date): number {
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / DAY_MS);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Number of calendar days covered by the range, counting both endpoints (minimum 1). */
export function inclusiveDayCount(startValue: string, endValue: string): number {
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  if (!start || !end) return 1;
  return Math.max(1, diffInDays(start, end) + 1);
}

export function formatDateLabel(value: string, includeYear = false): string {
  if (!value) return '';
  const d = parseDate(value);
  if (!d) return value;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
}

export function formatTimelineLabel(value: string): string {
  if (!value) return '';
  const d = parseDate(value);
  if (!d) return value;
  return `${TIMELINE_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

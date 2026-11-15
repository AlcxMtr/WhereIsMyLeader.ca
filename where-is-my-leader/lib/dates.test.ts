import { describe, expect, it } from 'vitest';

import { diffInDays, formatDateKey, inclusiveDayCount, parseDate, toDateKey } from './dates';

describe('dates', () => {
  it('parses plain dates as local midnight and rejects garbage', () => {
    const d = parseDate('2025-03-09');
    expect(d && [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2025, 2, 9, 0]);
    expect(parseDate('')).toBeNull();
    expect(parseDate('not a date')).toBeNull();
  });

  it('round-trips date keys and strips time components', () => {
    expect(formatDateKey(parseDate('2025-01-05')!)).toBe('2025-01-05');
    expect(toDateKey('2025-01-05T13:00:00Z')).toBe('2025-01-05');
  });

  it('counts whole calendar days across a DST change', () => {
    // US clocks spring forward on 2025-03-09; the gap must still be exactly 2 days.
    expect(diffInDays(parseDate('2025-03-08')!, parseDate('2025-03-10')!)).toBe(2);
  });

  it('counts both endpoints and never returns less than one day', () => {
    expect(inclusiveDayCount('2025-05-07', '2025-05-07')).toBe(1);
    expect(inclusiveDayCount('2025-05-07', '2025-05-10')).toBe(4);
    expect(inclusiveDayCount('2025-05-10', '2025-05-07')).toBe(1);
    expect(inclusiveDayCount('', '2025-05-07')).toBe(1);
  });
});

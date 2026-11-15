import { describe, expect, it } from 'vitest';

import {
  buildTimelineModel,
  clampFromOffset,
  clampToOffset,
  offsetToDateKey,
  resolveHandleForOffset,
  resolveTimelineRange,
} from './timeline';

const bounds = { minDate: '2025-01-01', maxDate: '2025-12-31' };

describe('resolveTimelineRange', () => {
  it('falls back to the data bounds when the user has not chosen a range', () => {
    expect(resolveTimelineRange('', '', bounds)).toEqual({ from: '2025-01-01', to: '2025-12-31' });
  });

  it('swaps an inverted range instead of rejecting it', () => {
    expect(resolveTimelineRange('2025-09-01', '2025-03-01', bounds)).toEqual({ from: '2025-03-01', to: '2025-09-01' });
  });
});

describe('timeline model', () => {
  const model = buildTimelineModel('2025-01-11', '2025-01-21', '2025-01-01', '2025-01-31')!;

  it('converts dates to day offsets and back', () => {
    expect([model.totalDays, model.fromDays, model.toDays]).toEqual([30, 10, 20]);
    expect(offsetToDateKey(model, 25)).toBe('2025-01-26');
  });

  it('is unavailable for invalid dates', () => {
    expect(buildTimelineModel('', '2025-01-21', '2025-01-01', '2025-01-31')).toBeNull();
  });

  it('keeps the handles from crossing', () => {
    expect(clampFromOffset(model, 25)).toBe(20);
    expect(clampToOffset(model, 5)).toBe(10);
  });

  it('picks the nearest handle, and for a collapsed range the one in the dragged direction', () => {
    expect(resolveHandleForOffset(model, 12)).toBe('from');
    expect(resolveHandleForOffset(model, 19)).toBe('to');

    const collapsed = buildTimelineModel('2025-01-11', '2025-01-11', '2025-01-01', '2025-01-31')!;
    expect(resolveHandleForOffset(collapsed, 3)).toBe('from');
    expect(resolveHandleForOffset(collapsed, 25)).toBe('to');
  });
});

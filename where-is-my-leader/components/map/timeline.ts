import { addDays, diffInDays, formatDateKey, parseDate } from '@/lib/dates';

import { tripOverlapsRange } from './tripUtils';
import type { TravelPoint } from './types';

export type DragHandle = 'from' | 'to';

export interface TimelineModel {
  min: Date;
  totalDays: number;
  fromDays: number;
  toDays: number;
}

/**
 * Applies the user's chosen range on top of the data bounds. An inverted range
 * (from after to) is swapped rather than rejected.
 */
export function resolveTimelineRange(
  userFrom: string,
  userTo: string,
  bounds: { minDate: string; maxDate: string } | null
): { from: string; to: string } {
  const rawFrom = userFrom || bounds?.minDate || '';
  const rawTo = userTo || bounds?.maxDate || '';
  return rawFrom > rawTo ? { from: rawTo, to: rawFrom } : { from: rawFrom, to: rawTo };
}

export function filterTripsByRange(trips: TravelPoint[], from: string, to: string): TravelPoint[] {
  if (!from && !to) return trips;
  return trips.filter(trip => tripOverlapsRange(trip, from, to));
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Converts the date strings into day offsets from `min`, or null if any are invalid. */
export function buildTimelineModel(from: string, to: string, min: string, max: string): TimelineModel | null {
  const minDate = parseDate(min);
  const maxDate = parseDate(max);
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!minDate || !maxDate || !fromDate || !toDate) return null;

  const totalDays = Math.max(1, diffInDays(minDate, maxDate));
  return {
    min: minDate,
    totalDays,
    fromDays: clamp(diffInDays(minDate, fromDate), 0, totalDays),
    toDays: clamp(diffInDays(minDate, toDate), 0, totalDays),
  };
}

export function offsetToDateKey(model: TimelineModel, offset: number): string {
  return formatDateKey(addDays(model.min, offset));
}

/** "From" can move anywhere up to the current "to"; "to" anywhere from the current "from". */
export function clampFromOffset(model: TimelineModel, offset: number): number {
  return clamp(offset, 0, model.toDays);
}

export function clampToOffset(model: TimelineModel, offset: number): number {
  return Math.min(model.totalDays, Math.max(offset, model.fromDays));
}

/**
 * Decides which handle a pointer-down at `offset` should drag. A collapsed range can always
 * be expanded: dragging left grows "from" backward, dragging right grows "to" forward.
 */
export function resolveHandleForOffset(model: TimelineModel, offset: number): DragHandle {
  if (model.fromDays !== model.toDays) {
    const fromDistance = Math.abs(offset - model.fromDays);
    const toDistance = Math.abs(offset - model.toDays);
    return fromDistance <= toDistance ? 'from' : 'to';
  }

  if (offset < model.fromDays) return 'from';
  if (offset > model.toDays) return 'to';

  const distanceToStart = model.fromDays;
  const distanceToEnd = model.totalDays - model.toDays;
  return distanceToEnd <= distanceToStart ? 'from' : 'to';
}

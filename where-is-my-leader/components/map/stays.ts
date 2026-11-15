import { inclusiveDayCount, formatDateKey, parseDate } from '@/lib/dates';

import { getCountryInfo, tripEnd, tripStart } from './tripUtils';
import type { TravelPoint } from './types';

export interface StayGroup {
  key: string;
  countryName: string;
  code: string | null;
  firstIndex: number;
  lastIndex: number;
  trips: TravelPoint[];
}

/**
 * Groups consecutive trips in the same country into "stays". Returns the most recent
 * stay first. `regionNames` lets callers localise country names from their ISO code.
 */
export function groupTripsIntoStays(
  trips: TravelPoint[],
  regionNames: { of(code: string): string | undefined } | null = null
): StayGroup[] {
  const groups: StayGroup[] = [];

  trips.forEach((trip, index) => {
    const info = getCountryInfo(trip.city);
    const fallbackName = info.name || trip.city.split(',')[0] || 'Unknown';
    const countryName = info.code ? regionNames?.of(info.code.toUpperCase()) || fallbackName : fallbackName;
    const countryIdentity = info.code ? `code:${info.code}` : `name:${countryName.toLowerCase()}`;
    const staysPrefix = `${countryIdentity}:stay:`;
    const previousGroup = groups[groups.length - 1];

    if (previousGroup && previousGroup.key.startsWith(staysPrefix)) {
      previousGroup.trips.push(trip);
      previousGroup.lastIndex = index;
      return;
    }

    const stayNumber = groups.filter(g => g.key.startsWith(staysPrefix)).length + 1;
    groups.push({
      key: `${staysPrefix}${stayNumber}`,
      countryName,
      code: info.code,
      firstIndex: index,
      lastIndex: index,
      trips: [trip],
    });
  });

  return groups.sort((a, b) => b.lastIndex - a.lastIndex);
}

/** Calendar days spanned from the earliest arrival to the latest departure of the trips. */
export function getStayDurationDays(trips: TravelPoint[]): number {
  let minStart: Date | null = null;
  let maxEnd: Date | null = null;

  for (const trip of trips) {
    const start = parseDate(tripStart(trip));
    const end = parseDate(tripEnd(trip));
    if (start && (!minStart || start < minStart)) minStart = start;
    if (end && (!maxEnd || end > maxEnd)) maxEnd = end;
  }

  if (!minStart || !maxEnd) return 1;
  return inclusiveDayCount(formatDateKey(minStart), formatDateKey(maxEnd));
}

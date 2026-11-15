import { describe, expect, it } from 'vitest';

import type { TravelPoint } from '@/lib/types';

import {
  findMostRecentTripIndex,
  formatTripDateRange,
  getCountryInfo,
  getTripDateBounds,
  tripOverlapsRange,
} from './tripUtils';

const trip = (id: number, city: string, arrival: string, departure = arrival): TravelPoint => ({
  id,
  city,
  coords: [0, 0],
  arrival,
  departure,
  desc: '',
  summary: '',
  citations: [],
});

describe('getCountryInfo', () => {
  it('resolves the country code from the last segment', () => {
    expect(getCountryInfo('Toronto, Ontario, Canada')).toEqual({ name: 'Canada', code: 'ca' });
  });

  it('matches names ignoring case and accents', () => {
    expect(getCountryInfo('Zurich, SWITZERLAND').code).toBe('ch');
    expect(getCountryInfo('Nowhere, Atlantis').code).toBeNull();
  });
});

describe('tripOverlapsRange', () => {
  const t = trip(1, 'Paris, France', '2025-06-10', '2025-06-12');

  it('includes trips that touch the range at either edge', () => {
    expect(tripOverlapsRange(t, '2025-06-12', '2025-06-20')).toBe(true);
    expect(tripOverlapsRange(t, '2025-06-01', '2025-06-10')).toBe(true);
  });

  it('excludes trips entirely outside the range', () => {
    expect(tripOverlapsRange(t, '2025-06-13', '2025-06-20')).toBe(false);
    expect(tripOverlapsRange(t, '2025-06-01', '2025-06-09')).toBe(false);
  });

  it('treats an open-ended range as unbounded', () => {
    expect(tripOverlapsRange(t, '', '')).toBe(true);
  });
});

describe('trip lookups', () => {
  const trips = [
    trip(1, 'Ottawa, Canada', '2025-05-01', '2025-05-02'),
    trip(2, 'Paris, France', '2025-05-10', '2025-05-12'),
    trip(3, 'Ottawa, Canada', '2025-05-20', '2025-05-21'),
  ];

  it('prefers the trip in progress, else the latest one', () => {
    expect(findMostRecentTripIndex(trips, new Date('2025-05-12T20:00:00'))).toBe(1);
    expect(findMostRecentTripIndex(trips, new Date('2025-05-15T00:00:00'))).toBe(2);
    expect(findMostRecentTripIndex([])).toBe(-1);
  });

  it('computes date bounds across all trips', () => {
    expect(getTripDateBounds(trips)).toEqual({ minDate: '2025-05-01', maxDate: '2025-05-21' });
    expect(getTripDateBounds([])).toBeNull();
  });
});

describe('formatTripDateRange', () => {
  it('collapses a same-day trip to one date', () => {
    expect(formatTripDateRange('2025-05-07', '2025-05-07', ' - ')).toBe('May 7, 2025');
    expect(formatTripDateRange('2025-05-07', '2025-05-09', ' - ')).toBe('May 7 - May 9, 2025');
  });
});

import { describe, expect, it } from 'vitest';

import { extendLastTripTo, getPersonTrips } from './people';
import { rowToTravelPoint, type TripRow } from './primeMinisterTrips';

const row = (overrides: Partial<TripRow> = {}): TripRow => ({
  id: 7,
  city: 'Paris, France',
  lat: 48.85,
  lng: 2.35,
  arrival: '2025-05-10',
  departure: '2025-05-12',
  short_summary: '  Short  ',
  long_summary: '  Long  ',
  citations: '["https://example.com"]',
  desc: ' fallback ',
  ...overrides,
});

describe('rowToTravelPoint', () => {
  it('prefers the long/short summaries and trims them', () => {
    expect(rowToTravelPoint(row())).toMatchObject({ desc: 'Long', summary: 'Short', coords: [48.85, 2.35] });
  });

  it('falls back to desc, then to a placeholder', () => {
    const fallback = rowToTravelPoint(row({ long_summary: null, short_summary: null }));
    expect([fallback.desc, fallback.summary]).toEqual(['fallback', 'fallback']);
    expect(rowToTravelPoint(row({ long_summary: null, short_summary: null, desc: null })).desc).toBe('No data available.');
  });

  it('tolerates missing coordinates and malformed citations', () => {
    const point = rowToTravelPoint(row({ lat: null, lng: null, citations: 'not json' }));
    expect(point.coords).toEqual([0, 0]);
    expect(point.citations).toEqual([]);
  });
});

describe('people', () => {
  it('extends only the final trip to today without mutating the source', () => {
    const trips = [
      { ...rowToTravelPoint(row({ id: 1 })) },
      { ...rowToTravelPoint(row({ id: 2, departure: '2025-06-01' })) },
    ];
    const extended = extendLastTripTo(trips, '2026-01-01');
    expect(extended.map(t => t.departure)).toEqual(['2025-05-12', '2026-01-01']);
    expect(trips[1].departure).toBe('2025-06-01');
  });

  it('only knows registered people', () => {
    expect(getPersonTrips('Andrew Deng')?.length).toBeGreaterThan(0);
    expect(getPersonTrips('Nobody')).toBeNull();
  });
});

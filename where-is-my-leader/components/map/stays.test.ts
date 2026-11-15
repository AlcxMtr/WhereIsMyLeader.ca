import { describe, expect, it } from 'vitest';

import type { TravelPoint } from '@/lib/types';

import { getStayDurationDays, groupTripsIntoStays } from './stays';

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

describe('groupTripsIntoStays', () => {
  const trips = [
    trip(1, 'Toronto, Ontario, Canada', '2025-05-01', '2025-05-06'),
    trip(2, 'Paris, France', '2025-05-07'),
    trip(3, 'Nice, France', '2025-05-08'),
    trip(4, 'Ottawa, Ontario, Canada', '2025-05-10'),
  ];

  it('merges consecutive trips in one country and lists the latest stay first', () => {
    const stays = groupTripsIntoStays(trips);
    expect(stays.map(s => s.trips.map(t => t.id))).toEqual([[4], [2, 3], [1]]);
  });

  it('numbers repeat visits to a country separately', () => {
    const stays = groupTripsIntoStays(trips);
    expect(stays.filter(s => s.code === 'ca').map(s => s.key)).toEqual(['code:ca:stay:2', 'code:ca:stay:1']);
  });

  it('uses the supplied region names when available', () => {
    const [latest] = groupTripsIntoStays(trips, { of: code => (code === 'CA' ? 'Canada (localised)' : undefined) });
    expect(latest.countryName).toBe('Canada (localised)');
  });
});

describe('getStayDurationDays', () => {
  it('spans the earliest arrival to the latest departure, inclusive', () => {
    const stay = [trip(1, 'Paris, France', '2025-05-07', '2025-05-08'), trip(2, 'Nice, France', '2025-05-08', '2025-05-10')];
    expect(getStayDurationDays(stay)).toBe(4);
  });
});

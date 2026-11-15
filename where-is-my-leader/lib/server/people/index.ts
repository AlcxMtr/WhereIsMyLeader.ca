import { DateTime } from 'luxon';

import type { TravelPoint } from '@/lib/types';

import { trips as andrewDengTrips } from './andrewDengTrips';

export interface PersonSource {
  /** Name the client passes as `?person=`. */
  name: string;
  loadTrips: () => TravelPoint[];
}

/** For someone who is still travelling: the final trip is treated as lasting until `today`. */
export function extendLastTripTo(trips: TravelPoint[], today: string): TravelPoint[] {
  if (!trips.length) return trips;
  const extended = [...trips];
  extended[extended.length - 1] = { ...extended[extended.length - 1], departure: today };
  return extended;
}

const torontoToday = () => DateTime.now().setZone('America/Toronto').toFormat('yyyy-MM-dd');

// Add a new person here (plus a data file next to this one) to serve them from /api/trips?person=<name>.
const PEOPLE: PersonSource[] = [
  {
    name: 'Andrew Deng',
    loadTrips: () => extendLastTripTo(andrewDengTrips, torontoToday()),
  },
];

/** Trips for a named person, or null if we don't know them. */
export function getPersonTrips(name: string): TravelPoint[] | null {
  return PEOPLE.find(person => person.name === name)?.loadTrips() ?? null;
}

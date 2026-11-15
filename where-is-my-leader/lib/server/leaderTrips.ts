import { DateTime } from 'luxon';

import { findSubject, type SubjectId } from '@/lib/subjects';
import type { TravelPoint } from '@/lib/types';

import { trips as andrewDengTrips } from './people/andrewDengTrips';
import { loadDatabaseTrips } from './sqliteTrips';

export type TripLoader = () => TravelPoint[] | null;

/** For someone who is still travelling: the final trip is treated as lasting until `today`. */
export function extendLastTripTo(trips: TravelPoint[], today: string): TravelPoint[] {
  if (!trips.length) return trips;
  const extended = [...trips];
  extended[extended.length - 1] = { ...extended[extended.length - 1], departure: today };
  return extended;
}

const torontoToday = () => DateTime.now().setZone('America/Toronto').toFormat('yyyy-MM-dd');

/**
 * Maps every registered subject ID to its data source (per-leader SQLite DB or static data).
 * Adding a subject to `lib/subjects.ts` requires adding its loader here.
 */
const LEADER_SOURCES: Record<SubjectId, TripLoader> = {
  carney: () => loadDatabaseTrips('trips.db', 'trips_fallback.json'),
  andrewdeng: () => extendLastTripTo(andrewDengTrips, torontoToday()),
  trump: () => loadDatabaseTrips('trump_trips.db', 'trump_trips_fallback.json'),
};

/** Loads trips for a registered subject (by ID or display name), or null if unknown or missing data. */
export function loadLeaderTrips(leader: string): TravelPoint[] | null {
  const subject = findSubject(leader);
  if (!subject) return null;
  return LEADER_SOURCES[subject.id]();
}

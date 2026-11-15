import { NextResponse } from 'next/server';

import { getPersonTrips } from '@/lib/server/people';
import { loadPrimeMinisterTrips } from '@/lib/server/primeMinisterTrips';

export const dynamic = 'force-dynamic';

/** GET /api/trips            -> the Prime Minister's trips
 *  GET /api/trips?person=... -> that person's trips (404 if unknown) */
export async function GET(request: Request) {
  try {
    const person = new URL(request.url).searchParams.get('person');

    if (person) {
      const trips = getPersonTrips(person);
      return trips ? NextResponse.json(trips) : NextResponse.json({ error: 'Person not found.' }, { status: 404 });
    }

    const trips = loadPrimeMinisterTrips();
    if (!trips) {
      return NextResponse.json(
        { error: 'Fatal: Database and fallback JSON are both missing.' },
        { status: 404 }
      );
    }
    return NextResponse.json(trips);
  } catch (error: unknown) {
    console.error('Database Error:', error);
    const details = error instanceof Error ? error.message : 'Unknown database error';
    return NextResponse.json({ error: 'Failed to fetch trips data', details }, { status: 500 });
  }
}

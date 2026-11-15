import { NextResponse } from 'next/server';

import { loadLeaderTrips } from '@/lib/server/leaderTrips';
import { DEFAULT_SUBJECT_ID, findSubject } from '@/lib/subjects';

export const dynamic = 'force-dynamic';

/** GET /api/trips?person=<id|name> -> that person's trips (defaults to carney; 404 if unknown or unavailable) */
export async function GET(request: Request) {
  try {
    const personParam = new URL(request.url).searchParams.get('person')?.trim();
    const subject = findSubject(personParam || DEFAULT_SUBJECT_ID);

    if (!subject) {
      return NextResponse.json({ error: 'Person not found.' }, { status: 404 });
    }

    const trips = loadLeaderTrips(subject.id);
    if (!trips) {
      return NextResponse.json(
        { error: `Fatal: Database and fallback data are missing for "${subject.id}".` },
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

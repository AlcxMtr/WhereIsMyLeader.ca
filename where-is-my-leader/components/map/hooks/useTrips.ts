import { useEffect, useState } from 'react';

import type { TravelPoint } from '@/lib/types';

export type TripsStatus = 'loading' | 'ready' | 'error';

const NO_TRIPS: TravelPoint[] = [];

async function fetchTrips(person: string | null | undefined, signal: AbortSignal): Promise<TravelPoint[]> {
  const url = person ? `/api/trips?person=${encodeURIComponent(person)}` : '/api/trips';
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`API returned status ${res.status}`);
  return (await res.json()) as TravelPoint[];
}

/** Loads a person's trips from the API, tracking loading/error state and ignoring stale responses. */
export function useTrips(person?: string | null): { trips: TravelPoint[]; status: TripsStatus } {
  const key = person ?? '';
  const [result, setResult] = useState<{ key: string; trips: TravelPoint[]; failed: boolean } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchTrips(person, controller.signal)
      .then(trips => setResult({ key, trips, failed: false }))
      .catch(error => {
        if (controller.signal.aborted) return;
        console.warn('Failed to load trips:', error);
        setResult({ key, trips: NO_TRIPS, failed: true });
      });
    return () => controller.abort();
  }, [person, key]);

  const current = result?.key === key ? result : null;
  if (!current) return { trips: NO_TRIPS, status: 'loading' };
  return { trips: current.trips, status: current.failed ? 'error' : 'ready' };
}

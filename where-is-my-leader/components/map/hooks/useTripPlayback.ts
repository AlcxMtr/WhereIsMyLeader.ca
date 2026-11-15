import { useCallback, useEffect, useRef, useState } from 'react';

import { parseDate } from '@/lib/dates';

import { sleep } from '../globe/browser';
import { getCountryInfo } from '../places';
import { tripEnd } from '../tripUtils';
import type { TimelineState, TravelPoint } from '../types';

export type FlyToTrip = (
  target: TravelPoint,
  origin?: TravelPoint | null,
  options?: { revealDetail?: boolean }
) => Promise<void>;

const AUTOPLAY_DWELL_MS = 3000;
const DEMO_DWELL_MS = 1400;

interface AutoPlayDeps {
  allTravelData: TravelPoint[];
  flyToTrip: FlyToTrip;
  cancelCamera: () => void;
  onNavigateStart: (trip: TravelPoint) => void;
  timeline: Pick<TimelineState, 'onFromChange' | 'onToChange'>;
}

/** "Explore past/future trips": walks trip by trip until it runs out or the user interacts. */
export function useAutoPlay({ allTravelData, flyToTrip, cancelCamera, onNavigateStart, timeline }: AutoPlayDeps) {
  const generationRef = useRef(0);
  const [active, setActive] = useState(false);
  const { onFromChange, onToChange } = timeline;

  const stop = useCallback(() => {
    generationRef.current += 1;
    setActive(false);
  }, []);

  // Any user interaction during auto-play cancels it (and any in-flight camera hop).
  useEffect(() => {
    if (!active) return undefined;

    const cancel = () => {
      cancelCamera();
      stop();
    };
    const events = ['pointerdown', 'wheel', 'keydown', 'touchstart'] as const;
    events.forEach(name => window.addEventListener(name, cancel, { passive: true }));
    return () => events.forEach(name => window.removeEventListener(name, cancel));
  }, [active, cancelCamera, stop]);

  const start = useCallback(
    async (direction: 'past' | 'future', fromTrip: TravelPoint) => {
      generationRef.current += 1;
      const generation = generationRef.current;
      const isPlaying = () => generationRef.current === generation;

      setActive(true);
      let currentTrip = fromTrip;

      while (isPlaying()) {
        const currentIndex = allTravelData.findIndex(t => t.id === currentTrip.id);
        const nextTrip = allTravelData[direction === 'past' ? currentIndex - 1 : currentIndex + 1];
        if (!nextTrip) break;

        onNavigateStart(nextTrip);

        // Widen the timeline as navigation starts so the destination is already in the
        // dataset when the camera lands and reveals trip details on zoom-in.
        if (direction === 'past') onFromChange(nextTrip.arrival);
        else onToChange(tripEnd(nextTrip));

        await flyToTrip(nextTrip, currentTrip);
        if (!isPlaying()) return;

        currentTrip = nextTrip;
        await sleep(AUTOPLAY_DWELL_MS);
      }

      if (isPlaying()) setActive(false);
    },
    [allTravelData, flyToTrip, onFromChange, onNavigateStart, onToChange]
  );

  return { startAutoPlay: start, autoPlayActive: active };
}

/**
 * Idle "screensaver" tour: chronologically walks past international trips (no popups) from a random
 * starting point while `enabled`. Any real navigation supersedes the in-flight hop via the camera.
 */
export function useDemoTour(enabled: boolean, allTravelData: TravelPoint[], flyToTrip: FlyToTrip) {
  useEffect(() => {
    if (!enabled) return undefined;

    const now = new Date();
    const demoTrips = allTravelData.filter(trip => {
      const arrival = parseDate(trip.arrival);
      if (!arrival || arrival > now) return false;
      return getCountryInfo(trip.city).code !== 'ca';
    });
    if (!demoTrips.length) return undefined;

    let cancelled = false;

    const run = async () => {
      let index = Math.floor(Math.random() * demoTrips.length);
      let current = demoTrips[index];
      while (!cancelled) {
        index = (index + 1) % demoTrips.length;
        const next = demoTrips[index];
        await flyToTrip(next, current, { revealDetail: false });
        if (cancelled) return;
        current = next;
        await sleep(DEMO_DWELL_MS);
      }
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [enabled, allTravelData, flyToTrip]);
}

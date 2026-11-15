import { useCallback } from 'react';

import { formatDateKey, parseDate } from '@/lib/dates';

import { OVERVIEW_ALTITUDE } from '../globe/cameraPlan';
import type { TimelineState, TravelPoint } from '../types';

interface WelcomeActionsDeps {
  allTravelData: TravelPoint[];
  mostRecentTripIndex: number;
  firstTripIndex: number;
  timeline: TimelineState;
  onDismissWelcome: () => void;
  onSeeAllTrips: () => void;
  onNavigateStart: (trip: TravelPoint) => void;
  focusPin: (trip: TravelPoint) => Promise<void>;
  lookAt: (coords: [number, number], altitude: number, durationMs: number) => void;
  cancelCamera: () => void;
  clearDetail: () => void;
}

/** Today clamped into [minDate, maxDate] and no earlier than the trip's arrival. */
function clampToday(today: Date, target: TravelPoint, minDate: string, maxDate: string): Date {
  const min = parseDate(minDate);
  const max = parseDate(maxDate);
  const arrival = parseDate(target.arrival);

  let clamped = min && today < min ? min : max && today > max ? max : today;
  if (arrival && clamped < arrival) clamped = arrival;
  return clamped;
}

/** The three choices on the welcome bubble. */
export function useWelcomeActions({
  allTravelData,
  mostRecentTripIndex,
  firstTripIndex,
  timeline,
  onDismissWelcome,
  onSeeAllTrips,
  onNavigateStart,
  focusPin,
  lookAt,
  cancelCamera,
  clearDetail,
}: WelcomeActionsDeps) {
  const { min, max, onFromChange, onToChange } = timeline;

  const showToday = useCallback(() => {
    onDismissWelcome();
    const target = allTravelData[mostRecentTripIndex];
    if (!target) return;

    onFromChange(target.arrival);
    onToChange(formatDateKey(clampToday(new Date(), target, min, max)));
    onNavigateStart(target);
    focusPin(target);
  }, [allTravelData, focusPin, max, min, mostRecentTripIndex, onDismissWelcome, onFromChange, onNavigateStart, onToChange]);

  const showFirst = useCallback(() => {
    onDismissWelcome();
    const target = allTravelData[firstTripIndex];
    if (!target) return;

    const arrival = parseDate(target.arrival);
    const departure = parseDate(target.departure);
    const safeTo = departure && arrival && departure >= arrival ? target.departure : target.arrival;

    onFromChange(target.arrival);
    onToChange(safeTo);
    onNavigateStart(target);
    focusPin(target);
  }, [allTravelData, firstTripIndex, focusPin, onDismissWelcome, onFromChange, onNavigateStart, onToChange]);

  const showAll = useCallback(() => {
    onDismissWelcome();
    onSeeAllTrips();
    // Invalidate any in-flight demo hop so the user isn't locked into an animation.
    cancelCamera();
    clearDetail();

    const target = allTravelData[mostRecentTripIndex];
    if (target) lookAt(target.coords, OVERVIEW_ALTITUDE, 1800);
  }, [allTravelData, cancelCamera, clearDetail, lookAt, mostRecentTripIndex, onDismissWelcome, onSeeAllTrips]);

  return { showToday, showFirst, showAll };
}

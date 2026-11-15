import { useMemo, useState } from 'react';

import { filterTripsByRange, resolveTimelineRange } from '../timeline';
import { getTripDateBounds } from '../tripUtils';
import type { TimelineState, TravelPoint } from '../types';

/** Owns the user's chosen date window and the trips that fall inside it. */
export function useTimelineFilter(allTrips: TravelPoint[]): { filteredTrips: TravelPoint[]; timeline: TimelineState } {
  const [userFrom, setUserFrom] = useState('');
  const [userTo, setUserTo] = useState('');

  const bounds = useMemo(() => getTripDateBounds(allTrips), [allTrips]);
  const { from, to } = resolveTimelineRange(userFrom, userTo, bounds);

  const filteredTrips = useMemo(() => filterTripsByRange(allTrips, from, to), [allTrips, from, to]);

  const timeline: TimelineState = {
    from,
    to,
    min: bounds?.minDate ?? '',
    max: bounds?.maxDate ?? '',
    onFromChange: setUserFrom,
    onToChange: setUserTo,
  };

  return { filteredTrips, timeline };
}

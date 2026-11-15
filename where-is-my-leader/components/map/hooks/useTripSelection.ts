import { useCallback, useMemo, useRef, useState } from 'react';

import type { SelectionState, TravelPoint } from '../types';

/**
 * Tracks which trip is highlighted in the list, which one has its detail bubble open,
 * and which one the sidebar asked the globe to fly to. Anything filtered out of
 * `visibleTrips` is treated as not selected.
 */
export function useTripSelection(visibleTrips: TravelPoint[]) {
  const [selection, setSelection] = useState<SelectionState>(null);
  const [activeDetail, setActiveDetail] = useState<TravelPoint | null>(null);
  const [activeListId, setActiveListId] = useState<number | null>(null);
  const selectionKey = useRef(0);

  const isVisible = useCallback((id: number) => visibleTrips.some(t => t.id === id), [visibleTrips]);

  const visibleSelection = useMemo(
    () => (selection && isVisible(selection.trip.id) ? selection : null),
    [isVisible, selection]
  );

  const visibleActiveDetail = useMemo(
    () => (activeDetail && isVisible(activeDetail.id) ? activeDetail : null),
    [activeDetail, isVisible]
  );

  const listActiveId = useMemo(() => {
    if (visibleActiveDetail) return visibleActiveDetail.id;
    if (activeListId == null) return null;
    return isVisible(activeListId) ? activeListId : null;
  }, [activeListId, isVisible, visibleActiveDetail]);

  /** A trip was chosen from the sidebar/strip: highlight it and ask the globe to fly there. */
  const selectFromList = useCallback((trip: TravelPoint) => {
    setActiveListId(trip.id);
    selectionKey.current += 1;
    setSelection({ trip, key: selectionKey.current });
  }, []);

  /** The globe started flying to a trip on its own (e.g. next/previous): just highlight it. */
  const markNavigatingTo = useCallback((trip: TravelPoint) => setActiveListId(trip.id), []);

  return {
    selection: visibleSelection,
    activeDetail: visibleActiveDetail,
    setActiveDetail,
    listActiveId,
    selectFromList,
    markNavigatingTo,
  };
}

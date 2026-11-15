import { useCallback, useState, type RefObject } from 'react';

import { haptic } from '../globe/browser';
import { FOCUS_ALTITUDE } from '../globe/cameraPlan';
import { createTripDetailElement } from '../tripDetail/createTripDetailElement';
import { tripEnd } from '../tripUtils';
import type { GlobeHandle, HtmlDetailDatum, ThemeMode, TimelineState, TravelPoint } from '../types';
import type { FlyToTrip } from './useTripPlayback';

interface TripDetailBubbleDeps {
  allTravelData: TravelPoint[];
  theme: ThemeMode;
  isMobile: boolean;
  mostRecentTripIndex: number;
  firstTripIndex: number;
  timeline: TimelineState;
  globeRef: RefObject<GlobeHandle | null>;
  flyToTrip: FlyToTrip;
  startAutoPlay: (direction: 'past' | 'future', fromTrip: TravelPoint) => void;
  onNavigateStart: (trip: TravelPoint) => void;
  closeDetail: () => void;
}

/** Builds the globe's HTML overlay for the open trip and owns its "learn more" expansion state. */
export function useTripDetailBubble({
  allTravelData,
  theme,
  isMobile,
  mostRecentTripIndex,
  firstTripIndex,
  timeline,
  globeRef,
  flyToTrip,
  startAutoPlay,
  onNavigateStart,
  closeDetail,
}: TripDetailBubbleDeps) {
  const [expandedTripId, setExpandedTripId] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const currentStayTripId = allTravelData.length ? allTravelData[allTravelData.length - 1].id : null;
  const { from: timelineFrom, to: timelineTo, onFromChange, onToChange } = timeline;

  const renderDetailHtml = useCallback(
    (datum: object) => {
      const { trip } = datum as HtmlDetailDatum;
      const index = allTravelData.findIndex(t => t.id === trip.id);
      const previousTrip = index > 0 ? allTravelData[index - 1] : null;
      const nextTrip = index >= 0 && index < allTravelData.length - 1 ? allTravelData[index + 1] : null;

      return createTripDetailElement({
        trip,
        theme,
        isMobile,
        isCurrentStay: currentStayTripId != null && trip.id === currentStayTripId,
        isExpanded: expandedTripId === trip.id && isExpanded,
        previousTrip,
        nextTrip,
        pulsePast: index === mostRecentTripIndex,
        pulseFuture: index === firstTripIndex,
        onToggleExpanded: nextExpanded => {
          setExpandedTripId(trip.id);
          setIsExpanded(nextExpanded);
        },
        onPrevious: () => {
          if (!previousTrip) return;
          haptic();
          onNavigateStart(previousTrip);
          if (timelineFrom && previousTrip.arrival < timelineFrom) onFromChange(previousTrip.arrival);
          if (timelineTo && previousTrip.arrival > timelineTo) onToChange(tripEnd(previousTrip));
          flyToTrip(previousTrip, trip);
        },
        onNext: () => {
          if (!nextTrip) return;
          haptic();
          onNavigateStart(nextTrip);
          const nextEnd = tripEnd(nextTrip);
          if (timelineTo && nextEnd > timelineTo) onToChange(nextEnd);
          if (timelineFrom && nextTrip.arrival < timelineFrom) onFromChange(nextTrip.arrival);
          flyToTrip(nextTrip, trip);
        },
        onClose: () => {
          closeDetail();
          setExpandedTripId(null);
          setIsExpanded(false);
        },
        onSeePast: () => {
          haptic();
          startAutoPlay('past', trip);
        },
        onSeeFuture: () => {
          haptic();
          startAutoPlay('future', trip);
        },
        onRecenter: () => {
          haptic();
          globeRef.current?.pointOfView({ lat: trip.coords[0], lng: trip.coords[1], altitude: FOCUS_ALTITUDE }, 700);
        },
      });
    },
    [
      allTravelData,
      closeDetail,
      currentStayTripId,
      expandedTripId,
      firstTripIndex,
      flyToTrip,
      globeRef,
      isExpanded,
      isMobile,
      mostRecentTripIndex,
      onFromChange,
      onNavigateStart,
      onToChange,
      startAutoPlay,
      theme,
      timelineFrom,
      timelineTo,
    ]
  );

  return renderDetailHtml;
}

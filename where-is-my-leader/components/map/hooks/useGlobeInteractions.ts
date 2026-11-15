import { useCallback, useEffect, type RefObject } from 'react';

import { haptic } from '../globe/browser';
import { findNearestByCoords } from '../globe/geo';
import type { GlobeHandle, TravelPoint } from '../types';

const DEFAULT_ALTITUDE = 1.8;
const MIN_ZOOM_ALTITUDE = 0.35;
const MAX_ZOOM_ALTITUDE = 5.5;

// Overlays that scroll/drag on their own and must not zoom the globe.
const ZOOM_EXCLUDED_SELECTOR = '[data-timeline-ui="true"], [data-detail-scroll="true"]';

const currentAltitude = (globe: GlobeHandle | null) => {
  const altitude = globe?.pointOfView()?.altitude;
  return typeof altitude === 'number' ? altitude : DEFAULT_ALTITUDE;
};

interface ZoomGestureOptions {
  isMobile: boolean;
  welcomeDismissed: boolean;
  /** The container element only exists while trips are shown; re-attach when that flips. */
  hasTrips: boolean;
}

/** Zoom via touch pinch, trackpad pinch, or desktop wheel scrolling. */
export function useZoomGestures(
  containerRef: RefObject<HTMLElement | null>,
  globeRef: RefObject<GlobeHandle | null>,
  { isMobile, welcomeDismissed, hasTrips }: ZoomGestureOptions
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const isExcluded = (target: EventTarget | null) =>
      !!(target as Element | null)?.closest?.(ZOOM_EXCLUDED_SELECTOR);

    const zoomBy = (factor: number, baseAltitude?: number) => {
      const globe = globeRef.current;
      if (!globe) return;
      const pov = globe.pointOfView() || {};
      const next = Math.max(
        MIN_ZOOM_ALTITUDE,
        Math.min(MAX_ZOOM_ALTITUDE, (baseAltitude ?? currentAltitude(globe)) * factor)
      );
      globe.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: next }, 0);
    };

    const onWheel = (event: WheelEvent) => {
      if (isMobile || !welcomeDismissed || isExcluded(event.target)) return;
      event.preventDefault();
      zoomBy(Math.exp(event.deltaY * (event.ctrlKey ? 0.01 : 0.005)));
    };

    let pinchStartDistance = 0;
    let pinchStartAltitude = DEFAULT_ALTITUDE;
    const touchDistance = (e: TouchEvent) =>
      Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (!welcomeDismissed || e.touches.length !== 2 || isExcluded(e.target)) {
        pinchStartDistance = 0;
        return;
      }
      pinchStartDistance = touchDistance(e);
      pinchStartAltitude = currentAltitude(globeRef.current);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pinchStartDistance || e.touches.length !== 2) return;
      e.preventDefault();
      const distance = touchDistance(e);
      if (distance > 0) zoomBy(pinchStartDistance / distance, pinchStartAltitude);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchStartDistance = 0;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [containerRef, globeRef, isMobile, welcomeDismissed, hasTrips]);
}

/** Touch taps are imprecise, so snap to the nearest pin within a zoom-scaled radius. */
export function useNearestPinTap(
  globeRef: RefObject<GlobeHandle | null>,
  {
    isMobile,
    welcomeDismissed,
    travelData,
    onPick,
  }: { isMobile: boolean; welcomeDismissed: boolean; travelData: TravelPoint[]; onPick: (trip: TravelPoint) => void }
) {
  return useCallback(
    // globe.gl passes (datum?, event?, coords) depending on the click source; coords is always last.
    (...args: unknown[]) => {
      if (!isMobile || !welcomeDismissed) return;
      const coords = args[args.length - 1] as { lat?: number; lng?: number } | undefined;
      if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return;
      const trip = findNearestByCoords(travelData, coords.lat, coords.lng, 3 + currentAltitude(globeRef.current) * 4);
      if (trip) {
        haptic();
        onPick(trip);
      }
    },
    [globeRef, isMobile, onPick, travelData, welcomeDismissed]
  );
}

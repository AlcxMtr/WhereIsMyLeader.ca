import { useCallback, useEffect, useRef, type RefObject } from 'react';

import { buildFlightPlan, buildPinPlan, playCameraPlan, STARTUP_ALTITUDE } from '../globe/cameraPlan';
import { getCountryInfo } from '../tripUtils';
import type { GlobeHandle, TravelPoint } from '../types';

interface CameraDeps {
  globeRef: RefObject<GlobeHandle | null>;
  allTravelData: TravelPoint[];
  setActiveDetail: (trip: TravelPoint | null) => void;
  setGlowingCountryCode: (code: string | null) => void;
}

/**
 * Camera moves for the globe. Each move supersedes any in-flight one: starting a new move
 * (or calling `cancel`) makes the previous one stop at its next step.
 */
export function useGlobeCamera({ globeRef, allTravelData, setActiveDetail, setGlowingCountryCode }: CameraDeps) {
  const generationRef = useRef(0);

  const cancel = useCallback(() => {
    generationRef.current += 1;
  }, []);

  const beginMove = useCallback(() => {
    generationRef.current += 1;
    const generation = generationRef.current;
    return () => generationRef.current === generation;
  }, []);

  /** Flies from the previous trip (or `origin`) to `target`, then optionally opens its detail bubble. */
  const flyToTrip = useCallback(
    async (target: TravelPoint, origin?: TravelPoint | null, options?: { revealDetail?: boolean }) => {
      const globe = globeRef.current;
      if (!globe) return;

      const isCurrent = beginMove();
      setActiveDetail(null);
      setGlowingCountryCode(getCountryInfo(target.city).code ?? null);

      let departure = origin ?? null;
      if (!departure) {
        const targetIndex = allTravelData.findIndex(t => t.id === target.id);
        departure = targetIndex > 0 ? allTravelData[targetIndex - 1] : null;
      }

      const plan = buildFlightPlan(departure?.coords ?? null, target.coords);
      const completed = await playCameraPlan(globe, plan, isCurrent);
      if (completed && (options?.revealDetail ?? true)) setActiveDetail(target);
    },
    [allTravelData, beginMove, globeRef, setActiveDetail, setGlowingCountryCode]
  );

  /** Pans straight to `target` and opens its detail bubble. */
  const focusPin = useCallback(
    async (target: TravelPoint) => {
      const globe = globeRef.current;
      if (!globe) return;

      const isCurrent = beginMove();
      setActiveDetail(null);
      setGlowingCountryCode(getCountryInfo(target.city).code ?? null);

      const completed = await playCameraPlan(globe, buildPinPlan(target.coords), isCurrent);
      if (completed) setActiveDetail(target);
    },
    [beginMove, globeRef, setActiveDetail, setGlowingCountryCode]
  );

  const lookAt = useCallback(
    (coords: [number, number], altitude: number, durationMs: number) => {
      globeRef.current?.pointOfView({ lat: coords[0], lng: coords[1], altitude }, durationMs);
    },
    [globeRef]
  );

  return { flyToTrip, focusPin, lookAt, cancel };
}

/**
 * Points the globe at `target` immediately and locks its controls, retrying until the globe has mounted.
 * Runs once per globe mount: later changes to `target` (e.g. the timeline widening during
 * "explore trips") must not yank the camera back to the startup view.
 */
export function useStartupView(globeRef: RefObject<GlobeHandle | null>, target: TravelPoint | null) {
  const targetRef = useRef(target);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  const hasTarget = target !== null;

  useEffect(() => {
    if (!hasTarget) return undefined;

    const applyStartupView = () => {
      const globe = globeRef.current;
      const start = targetRef.current;
      if (!globe || !start) return false;

      const controls = globe.controls();
      if (controls) {
        controls.autoRotate = false;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.minDistance = 90;
        controls.maxDistance = 520;
      }

      globe.pointOfView({ lat: start.coords[0], lng: start.coords[1], altitude: STARTUP_ALTITUDE }, 0);
      return true;
    };

    if (applyStartupView()) return undefined;

    // Globe ref can be late on first mount; retry briefly so startup POV is always applied.
    let retries = 0;
    const maxRetries = 40;
    const timer = window.setInterval(() => {
      retries += 1;
      if (applyStartupView() || retries >= maxRetries) window.clearInterval(timer);
    }, 50);

    return () => window.clearInterval(timer);
  }, [globeRef, hasTarget]);
}

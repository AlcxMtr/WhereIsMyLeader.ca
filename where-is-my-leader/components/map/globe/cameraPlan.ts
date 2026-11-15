import { buildGreatCirclePath, getDistanceBasedMidAltitude } from './geo';
import { sleep } from './browser';
import type { GlobeHandle } from '../types';

type Coords = [number, number];

/** Altitude used when the camera is parked on a single trip. */
export const FOCUS_ALTITUDE = 0.58;
export const STARTUP_ALTITUDE = 1.35;
export const OVERVIEW_ALTITUDE = 2.2;

/** One camera move: ease towards the target over `moveMs`, then hold for `waitMs` before the next step. */
export interface CameraStep {
  lat: number;
  lng: number;
  altitude: number;
  moveMs: number;
  waitMs: number;
}

const PATH_SAMPLES = 72;
const PATH_DURATION_MS = 1850;

/** Camera choreography for flying from `from` to `to` (or just settling on `to` when there is no origin). */
export function buildFlightPlan(from: Coords | null, to: Coords): CameraStep[] {
  const arrive = (moveMs: number, waitMs: number): CameraStep => ({
    lat: to[0],
    lng: to[1],
    altitude: FOCUS_ALTITUDE,
    moveMs,
    waitMs,
  });

  if (!from) return [arrive(1200, 1250)];

  const midAltitude = getDistanceBasedMidAltitude(from, to);
  const path = buildGreatCirclePath(from, to, PATH_SAMPLES);
  const perStep = Math.max(16, Math.floor(PATH_DURATION_MS / path.length));

  return [
    { lat: from[0], lng: from[1], altitude: FOCUS_ALTITUDE, moveMs: 1000, waitMs: 1050 },
    { lat: from[0], lng: from[1], altitude: midAltitude, moveMs: 900, waitMs: 950 },
    ...path.map(node => ({
      lat: node.lat,
      lng: node.lng,
      altitude: midAltitude,
      moveMs: perStep + 10,
      waitMs: perStep,
    })),
    arrive(1100, 1150),
  ];
}

/** A single pan to `to` with no fly-over, used when jumping straight to a pin. */
export function buildPinPlan(to: Coords): CameraStep[] {
  return [{ lat: to[0], lng: to[1], altitude: FOCUS_ALTITUDE, moveMs: 1000, waitMs: 1050 }];
}

/**
 * Plays the steps in order, stopping as soon as `isCurrent()` turns false.
 * Resolves true only if every step ran to completion.
 */
export async function playCameraPlan(
  globe: GlobeHandle,
  steps: CameraStep[],
  isCurrent: () => boolean
): Promise<boolean> {
  for (const step of steps) {
    if (!isCurrent()) return false;
    globe.pointOfView({ lat: step.lat, lng: step.lng, altitude: step.altitude }, step.moveMs);
    await sleep(step.waitMs);
  }
  return isCurrent();
}

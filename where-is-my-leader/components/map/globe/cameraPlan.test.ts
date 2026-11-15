import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { GlobeHandle } from '../types';
import { buildFlightPlan, FOCUS_ALTITUDE, playCameraPlan } from './cameraPlan';
import { findNearestByCoords } from './geo';

describe('buildFlightPlan', () => {
  it('settles directly on the target when there is no origin', () => {
    const plan = buildFlightPlan(null, [48.85, 2.35]);
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ lat: 48.85, lng: 2.35, altitude: FOCUS_ALTITUDE });
  });

  it('starts over the origin, climbs, follows the route, and lands on the target', () => {
    const plan = buildFlightPlan([45.42, -75.69], [48.85, 2.35]);
    expect(plan[0]).toMatchObject({ lat: 45.42, lng: -75.69, altitude: FOCUS_ALTITUDE });
    expect(plan[1].altitude).toBeGreaterThan(FOCUS_ALTITUDE);
    expect(plan.at(-1)).toMatchObject({ lat: 48.85, lng: 2.35, altitude: FOCUS_ALTITUDE });

    const route = plan.slice(2, -1);
    expect(route[0].lat).toBeCloseTo(45.42, 3);
    expect(route.at(-1)!.lat).toBeCloseTo(48.85, 3);
  });
});

describe('playCameraPlan', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', globalThis);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const step = (lat: number) => ({ lat, lng: 0, altitude: 1, moveMs: 10, waitMs: 10 });

  it('plays every step when nothing supersedes it', async () => {
    const pointOfView = vi.fn();
    const done = playCameraPlan({ pointOfView } as unknown as GlobeHandle, [step(1), step(2)], () => true);
    await vi.runAllTimersAsync();
    expect(await done).toBe(true);
    expect(pointOfView).toHaveBeenCalledTimes(2);
  });

  it('stops at the next step once superseded', async () => {
    const pointOfView = vi.fn();
    let current = true;
    const done = playCameraPlan({ pointOfView } as unknown as GlobeHandle, [step(1), step(2), step(3)], () => current);
    current = false;
    await vi.runAllTimersAsync();
    expect(await done).toBe(false);
    expect(pointOfView).toHaveBeenCalledTimes(1);
  });
});

describe('findNearestByCoords', () => {
  const items = [
    { id: 'ottawa', coords: [45.42, -75.69] as [number, number] },
    { id: 'paris', coords: [48.85, 2.35] as [number, number] },
  ];

  it('returns the closest item within range, else null', () => {
    expect(findNearestByCoords(items, 46, -75, 5)?.id).toBe('ottawa');
    expect(findNearestByCoords(items, 0, 0, 5)).toBeNull();
  });
});

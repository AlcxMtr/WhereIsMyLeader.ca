import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  buildCountryPolygons,
  countryAltitude,
  countryCapColor,
  countryStrokeColor,
  type RawCountryFeature,
} from '../globe/countryOverlay';
import { getCountryInfo } from '../places';
import type { CountryPolygonDatum, TravelPoint } from '../types';

/**
 * Highlights visited countries on the globe. `glowingCountryCode` is set as soon as navigation
 * starts so the overlay brightens immediately; hover state lives in accessors so globe.gl only
 * updates changed materials (no mesh teardown, so no flicker).
 */
export function useCountryOverlay(travelData: TravelPoint[]) {
  const [worldFeatures, setWorldFeatures] = useState<RawCountryFeature[]>([]);
  const [glowingCountryCode, setGlowingCountryCode] = useState<string | null>(null);
  const [hoveredCountryCode, setHoveredCountryCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/geojson/world.geojson')
      .then(r => r.json())
      .then((d: { features?: RawCountryFeature[] }) => {
        if (!cancelled) setWorldFeatures(d.features ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const visitedCodes = useMemo(() => {
    const codes = new Set<string>();
    travelData.forEach(trip => {
      const { code } = getCountryInfo(trip.city);
      if (code) codes.add(code);
    });
    return codes;
  }, [travelData]);

  const polygons = useMemo(() => buildCountryPolygons(worldFeatures, visitedCodes), [worldFeatures, visitedCodes]);

  const highlight = useMemo(
    () => ({ glowingCode: glowingCountryCode, hoveredCode: hoveredCountryCode }),
    [glowingCountryCode, hoveredCountryCode]
  );

  const capColor = useCallback((d: object) => countryCapColor((d as CountryPolygonDatum).countryCode, highlight), [highlight]);
  const strokeColor = useCallback(
    (d: object) => countryStrokeColor((d as CountryPolygonDatum).countryCode, highlight),
    [highlight]
  );
  const altitude = useCallback((d: object) => countryAltitude((d as CountryPolygonDatum).countryCode, highlight), [highlight]);
  const onHover = useCallback((datum: object | null) => {
    setHoveredCountryCode((datum as CountryPolygonDatum | null)?.countryCode ?? null);
  }, []);

  return { polygons, capColor, strokeColor, altitude, onHover, setGlowingCountryCode };
}

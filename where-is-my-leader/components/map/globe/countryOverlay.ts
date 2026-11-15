import { flagPrimaryColors } from '../flagColors';
import type { CountryPolygonDatum } from '../types';
import { hexBrightRgba, hexToRgba } from './colors';

/** A feature of public/geojson/world.geojson (built by scripts/build-country-data.mjs). */
export type RawCountryFeature = { properties: { code: string; name: string }; geometry: object };

const DEFAULT_COUNTRY_HEX = '#ffffff';

export interface CountryHighlight {
  glowingCode: string | null;
  hoveredCode: string | null;
}

/** Keeps only the world features for countries that have been visited. */
export function buildCountryPolygons(features: RawCountryFeature[], visitedCodes: Set<string>): CountryPolygonDatum[] {
  const polygons: CountryPolygonDatum[] = [];
  for (const feature of features) {
    const { code } = feature.properties;
    if (visitedCodes.has(code)) {
      polygons.push({ type: 'Feature', countryCode: code, geometry: feature.geometry, properties: feature.properties });
    }
  }
  return polygons;
}

export function countryCapColor(code: string, { glowingCode, hoveredCode }: CountryHighlight): string {
  const hex = flagPrimaryColors[code] ?? DEFAULT_COUNTRY_HEX;
  const isGlowing = code === glowingCode;
  const isHovered = code === hoveredCode;
  if (isGlowing && isHovered) return hexBrightRgba(hex, 1.55, 0.65);
  if (isGlowing) return hexBrightRgba(hex, 1.4, 0.52);
  if (isHovered) return hexBrightRgba(hex, 1.2, 0.36);
  return hexToRgba(hex, 0.24);
}

export function countryStrokeColor(code: string, { glowingCode, hoveredCode }: CountryHighlight): string {
  const hex = flagPrimaryColors[code] ?? DEFAULT_COUNTRY_HEX;
  if (code === glowingCode || code === hoveredCode) return hexBrightRgba(hex, 1.6, 0.85);
  return hexBrightRgba(hex, 1.35, 0.55);
}

export function countryAltitude(code: string, { glowingCode, hoveredCode }: CountryHighlight): number {
  if (code === hoveredCode) return 0.022;
  if (code === glowingCode) return 0.012;
  return 0.008;
}

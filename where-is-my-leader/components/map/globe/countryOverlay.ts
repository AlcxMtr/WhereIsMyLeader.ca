import { flagPrimaryColors } from '../flagColors';
import type { CountryPolygonDatum } from '../types';
import { hexBrightRgba, hexToRgba } from './colors';

export type RawCountryFeature = { properties: Record<string, unknown>; geometry: object };

// Natural Earth 110m has ISO_A2="-99" for a handful of countries; fall back to ADM0_A3 mapping.
const ADM0_A3_FALLBACK: Record<string, string> = {
  FRA: 'fr',
  NOR: 'no',
  CYN: 'cy',
};

const DEFAULT_COUNTRY_HEX = '#ffffff';

export interface CountryHighlight {
  glowingCode: string | null;
  hoveredCode: string | null;
}

function resolveCountryCode(feature: RawCountryFeature): string | undefined {
  const raw = feature.properties.ISO_A2 as string | undefined;
  if (raw && raw !== '-99') return raw.toLowerCase();
  return ADM0_A3_FALLBACK[(feature.properties.ADM0_A3 as string | undefined) ?? ''];
}

/** Keeps only the world features for countries that have been visited. */
export function buildCountryPolygons(features: RawCountryFeature[], visitedCodes: Set<string>): CountryPolygonDatum[] {
  const polygons: CountryPolygonDatum[] = [];
  for (const feature of features) {
    const code = resolveCountryCode(feature);
    if (code && visitedCodes.has(code)) {
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

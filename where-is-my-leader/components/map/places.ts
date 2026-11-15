import { generatedCountryNameToCode } from './countryNames.generated';
import { cityNameToCode, countryNameToCode } from './locationData';

export interface CountryInfo {
  /** Country as written in the place string (its last segment), or null for an empty string. */
  name: string | null;
  /** Lowercase ISO 3166-1 alpha-2 code, or null if the place couldn't be resolved. */
  code: string | null;
}

/**
 * Lowercases and strips accents, punctuation and a leading "the" so place names compare loosely
 * ("the Netherlands" ~ "Netherlands", "Antigua & Barbuda" ~ "Antigua and Barbuda").
 */
export function normalizePlaceName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[().,'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^the /, '');
}

/** Hand-maintained names (provinces, short forms) take precedence over the generated, complete list. */
const allCountryNames: Record<string, string> = { ...generatedCountryNameToCode, ...countryNameToCode };

/** Normalized name -> code; earlier sources win when two names normalize to the same key. */
function buildNormalizedLookup(...sources: Array<Record<string, string>>): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const source of sources) {
    for (const [name, code] of Object.entries(source)) {
      const key = normalizePlaceName(name);
      if (!lookup.has(key)) lookup.set(key, code);
    }
  }
  return lookup;
}

let normalizedCountries: Map<string, string> | null = null;
let normalizedCities: Map<string, string> | null = null;
const countryInfoCache = new Map<string, CountryInfo>();

/** First segment of a "City, Region, Country" string. */
export function cityLabel(city: string): string {
  return city.split(',')[0]?.trim() || city;
}

function resolveCountryInfo(city: string): CountryInfo {
  const parts = city.split(',').map(part => part.trim()).filter(Boolean);
  const cityPart = parts[0] ?? '';
  const rawCountry = parts[parts.length - 1] ?? '';

  let code: string | null = allCountryNames[rawCountry] ?? cityNameToCode[cityPart] ?? null;

  const normalizedCountry = normalizePlaceName(rawCountry);
  if (!code && normalizedCountry) {
    normalizedCountries ??= buildNormalizedLookup(countryNameToCode, generatedCountryNameToCode);
    code = normalizedCountries.get(normalizedCountry) ?? null;
  }

  const normalizedCity = normalizePlaceName(cityPart);
  if (!code && normalizedCity) {
    normalizedCities ??= buildNormalizedLookup(cityNameToCode);
    code = normalizedCities.get(normalizedCity) ?? null;
  }

  return { name: rawCountry || cityPart || null, code };
}

/**
 * Country name and code for a "City, Region, Country" string. Results are cached per string,
 * since the same few places are looked up on every render of the list, globe and overlay.
 */
export function getCountryInfo(city: string): Readonly<CountryInfo> {
  let info = countryInfoCache.get(city);
  if (!info) {
    info = resolveCountryInfo(city);
    countryInfoCache.set(city, info);
  }
  return info;
}

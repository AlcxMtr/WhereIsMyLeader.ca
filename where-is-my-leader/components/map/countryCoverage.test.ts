import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import { trips as andrewDengTrips } from '@/lib/server/people/andrewDengTrips';
import type { TravelPoint } from '@/lib/types';

import { mappedCountryCodes } from './countryNames.generated';
import { flagPrimaryColors } from './flagColors';
import { cityNameToCode, countryNameToCode } from './locationData';
import { getCountryInfo } from './places';

type Ring = number[][];
interface WorldFeature {
  properties: { code: string; name: string };
  geometry: { type: 'Polygon'; coordinates: Ring[] } | { type: 'MultiPolygon'; coordinates: Ring[][] };
}

const world = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../public/geojson/world.geojson'), 'utf8')
) as { features: WorldFeature[] };

const englishName = new Intl.DisplayNames(['en'], { type: 'region' });

/**
 * Every country must have a flag, a highlight shape and a highlight colour. A missing entry
 * doesn't crash anything, it just silently leaves a country blank, so these checks guard it.
 */
describe('country coverage', () => {
  it('covers every country in the world', () => {
    // ISO 3166-1 has 249 codes; Natural Earth adds Kosovo (xk) and lacks only the US minor outlying islands (um).
    expect(mappedCountryCodes.length).toBeGreaterThanOrEqual(249);
  });

  it('has a highlight colour for every mapped country', () => {
    const missing = mappedCountryCodes.filter(code => !flagPrimaryColors[code]);
    expect(missing).toEqual([]);
  });

  it('has a highlight shape for every mapped country', () => {
    const ringsByCode = new Map<string, Ring[]>();
    for (const { properties, geometry } of world.features) {
      const outerRings = geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.coordinates.map(p => p[0]);
      ringsByCode.set(properties.code, [...(ringsByCode.get(properties.code) ?? []), ...outerRings]);
    }
    const missing = mappedCountryCodes.filter(code => !ringsByCode.get(code)?.some(ring => ring.length >= 4));
    expect(missing).toEqual([]);
  });

  it('resolves every mapped country from its English name (so it gets a flag)', () => {
    const unresolved = mappedCountryCodes.filter(
      code => getCountryInfo(`Capital, ${englishName.of(code.toUpperCase())}`).code !== code
    );
    expect(unresolved).toEqual([]);
  });

  it('only uses codes that exist on the map', () => {
    const codes = new Set(mappedCountryCodes);
    const used = [
      ...Object.keys(flagPrimaryColors),
      ...Object.values(countryNameToCode),
      ...Object.values(cityNameToCode),
    ];
    expect([...new Set(used.filter(code => !codes.has(code)))]).toEqual([]);
  });
});

describe('real place strings', () => {
  it.each([
    ['Phnom Penh, Cambodia', 'kh'],
    ["St. John's, Antigua and Barbuda", 'ag'],
    ["St. John's, Antigua & Barbuda", 'ag'],
    ['Singapore, Republic of Singapore', 'sg'],
    ['The Hague, the Netherlands', 'nl'],
    ['Beijing, People’s Republic of China', 'cn'],
    ['Busan, Republic of Korea', 'kr'],
    ['Ankara, Türkiye', 'tr'],
    ['Washington, D.C., United States of America', 'us'],
    ['Abidjan, Côte d’Ivoire', 'ci'],
    ['Kinshasa, Democratic Republic of the Congo', 'cd'],
    ['Montréal, Québec', 'ca'],
    ['Tbilisi, Georgia', 'ge'],
  ])('%s -> %s', (place, code) => {
    expect(getCountryInfo(place).code).toBe(code);
  });

  it('resolves every place in the bundled trip data', () => {
    const sharedData = path.join(__dirname, '../../../shared-data');
    const fallback = JSON.parse(fs.readFileSync(path.join(sharedData, 'trips_fallback.json'), 'utf8')) as TravelPoint[];

    const db = new Database(path.join(sharedData, 'trips_archive_v2.db'), { readonly: true });
    const archived = (db.prepare('SELECT DISTINCT city FROM aggregated_trips').all() as Array<{ city: string }>).map(
      row => row.city
    );
    db.close();

    const unresolved = [...fallback.map(t => t.city), ...andrewDengTrips.map(t => t.city), ...archived].filter(
      city => getCountryInfo(city).code === null
    );
    expect([...new Set(unresolved)]).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';

import { cityLabel, getCountryInfo, normalizePlaceName } from './places';

describe('getCountryInfo', () => {
  it('resolves the country code from the last segment', () => {
    expect(getCountryInfo('Toronto, Ontario, Canada')).toEqual({ name: 'Canada', code: 'ca' });
  });

  it('matches names ignoring case and accents', () => {
    expect(getCountryInfo('Zurich, SWITZERLAND').code).toBe('ch');
    expect(getCountryInfo('Nowhere, Atlantis').code).toBeNull();
  });

  it('returns the same cached result for repeated lookups', () => {
    expect(getCountryInfo('Ottawa, Ontario')).toBe(getCountryInfo('Ottawa, Ontario'));
  });
});

describe('place name helpers', () => {
  it('takes the city from the first segment', () => {
    expect(cityLabel('Évian, France')).toBe('Évian');
    expect(cityLabel('Paris')).toBe('Paris');
  });

  it('normalizes accents, punctuation and spacing', () => {
    expect(normalizePlaceName("  Côte d'Ivoire ")).toBe('cote divoire');
  });
});

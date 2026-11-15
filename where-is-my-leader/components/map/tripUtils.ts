import { endOfDay, formatDateKey, formatDateLabel, parseDate, startOfDay, toDateKey } from '@/lib/dates';

import { cityNameToCode, countryNameToCode } from './locationData';
import type { TravelPoint } from './types';

export function normalizePlaceName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[().,'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildNormalizedLookup(source: Record<string, string>): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const [name, code] of Object.entries(source)) {
    const key = normalizePlaceName(name);
    if (!lookup.has(key)) lookup.set(key, code);
  }
  return lookup;
}

let normalizedCountries: Map<string, string> | null = null;
let normalizedCities: Map<string, string> | null = null;

/** First segment of a "City, Region, Country" string. */
export function cityLabel(city: string): string {
  return city.split(',')[0]?.trim() || city;
}

export function getCountryInfo(city: string): { name: string | null; code: string | null } {
  const parts = city.split(',').map(part => part.trim()).filter(Boolean);
  const cityPart = parts[0] ?? '';
  const rawCountry = parts[parts.length - 1] ?? '';

  const normalizedCountry = normalizePlaceName(rawCountry);
  const normalizedCity = normalizePlaceName(cityPart);

  let code: string | null = countryNameToCode[rawCountry] ?? cityNameToCode[cityPart] ?? null;

  if (!code && normalizedCountry) {
    normalizedCountries ??= buildNormalizedLookup(countryNameToCode);
    code = normalizedCountries.get(normalizedCountry) ?? null;
  }

  if (!code && normalizedCity) {
    normalizedCities ??= buildNormalizedLookup(cityNameToCode);
    code = normalizedCities.get(normalizedCity) ?? null;
  }

  return {
    name: rawCountry || cityPart || null,
    code,
  };
}

export function formatTripDateRange(arrival: string, departure: string, separator: string): string {
  const arrivalLabel = formatDateLabel(arrival);
  const departureLabel = formatDateLabel(departure, true);

  if (arrivalLabel && departureLabel && toDateKey(arrival) === toDateKey(departure)) {
    return departureLabel;
  }

  if (arrivalLabel && departureLabel) return `${arrivalLabel}${separator}${departureLabel}`;
  return arrivalLabel || departureLabel;
}

/** Date a trip is considered to start/end on, falling back to the other endpoint. */
export const tripStart = (trip: TravelPoint) => trip.arrival || trip.departure;
export const tripEnd = (trip: TravelPoint) => trip.departure || trip.arrival;

export function tripOverlapsRange(trip: TravelPoint, fromDate: string, toDate: string): boolean {
  const start = startOfDay(tripStart(trip));
  const end = endOfDay(tripEnd(trip));

  if (!start || !end) return true;

  const from = fromDate ? startOfDay(fromDate) : null;
  const to = toDate ? endOfDay(toDate) : null;

  if (from && end < from) return false;
  if (to && start > to) return false;

  return true;
}

/** True once the trip's arrival date has been reached. */
export function hasTripStarted(trip: TravelPoint, now: Date = new Date()): boolean {
  const arrival = parseDate(trip.arrival);
  return arrival !== null && arrival <= now;
}

/** Earliest and latest dates (as `YYYY-MM-DD`) covered by the trips, or null if none are dated. */
export function getTripDateBounds(trips: TravelPoint[]): { minDate: string; maxDate: string } | null {
  let min: Date | null = null;
  let max: Date | null = null;

  for (const trip of trips) {
    const arrival = parseDate(trip.arrival);
    const departure = parseDate(trip.departure);
    const start = arrival ?? departure;
    const end = departure ?? arrival;

    if (start && (!min || start < min)) min = start;
    if (end && (!max || end > max)) max = end;
  }

  if (!min || !max) return null;
  return { minDate: formatDateKey(min), maxDate: formatDateKey(max) };
}

/** Index of the trip whose stay window contains `now`, or -1. */
export function findCurrentTripIndex(trips: TravelPoint[], now: Date = new Date()): number {
  return trips.findIndex(trip => {
    const arrival = parseDate(trip.arrival);
    const departure = endOfDay(tripEnd(trip));
    if (!arrival || !departure) return false;
    return arrival <= now && now <= departure;
  });
}

// Trip whose stay window contains "now", else the most recent trip by arrival order.
export function findMostRecentTripIndex(trips: TravelPoint[], now: Date = new Date()): number {
  if (!trips.length) return -1;
  const currentIndex = findCurrentTripIndex(trips, now);
  return currentIndex >= 0 ? currentIndex : trips.length - 1;
}

// First trip whose city resolves to a USA country code, falling back to the first trip overall.
export function findFirstUsTripIndex(trips: TravelPoint[]): number {
  if (!trips.length) return -1;
  const usIndex = trips.findIndex(trip => getCountryInfo(trip.city).code === 'us');
  return usIndex >= 0 ? usIndex : 0;
}

import type { TravelPoint } from './types';
import { cityNameToCode, countryNameToCode } from './locationData';

export function normalizePlaceName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[().,'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const safeStr = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
  const d = new Date(safeStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTimelineLabel(dateStr: string): string {
  if (!dateStr) return '';
  const safeStr = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
  const d = new Date(safeStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May.', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function getCountryInfo(city: string): { name: string | null; code: string | null } {
  const parts = city.split(',').map(part => part.trim()).filter(Boolean);
  const cityPart = parts[0] ?? '';
  const rawCountry = parts[parts.length - 1] ?? '';

  const normalizedCountry = normalizePlaceName(rawCountry);
  const normalizedCity = normalizePlaceName(cityPart);

  let code = countryNameToCode[rawCountry] ?? cityNameToCode[cityPart] ?? null;

  if (!code && normalizedCountry) {
    const matchedCountry = Object.entries(countryNameToCode).find(
      ([name]) => normalizePlaceName(name) === normalizedCountry
    );
    if (matchedCountry) code = matchedCountry[1];
  }

  if (!code && normalizedCity) {
    const matchedCity = Object.entries(cityNameToCode).find(
      ([name]) => normalizePlaceName(name) === normalizedCity
    );
    if (matchedCity) code = matchedCity[1];
  }

  return {
    name: rawCountry || cityPart || null,
    code,
  };
}

function parseDateSafe(value: string): Date | null {
  if (!value) return null;
  // FIX: Ensure range calculations don't drop a day
  const safeStr = value.includes('T') ? value : `${value}T00:00:00`;
  const d = new Date(safeStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseDate(value: string): Date | null {
  return parseDateSafe(value);
}

function startOfDay(value: string): Date | null {
  const d = parseDateSafe(value);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(value: string): Date | null {
  const d = parseDateSafe(value);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function tripOverlapsRange(trip: TravelPoint, fromDate: string, toDate: string): boolean {
  const tripStart = startOfDay(trip.arrival || trip.departure);
  const tripEnd = endOfDay(trip.departure || trip.arrival);

  if (!tripStart || !tripEnd) return true;

  const from = fromDate ? startOfDay(fromDate) : null;
  const to = toDate ? endOfDay(toDate) : null;

  if (from && tripEnd < from) return false;
  if (to && tripStart > to) return false;

  return true;
}
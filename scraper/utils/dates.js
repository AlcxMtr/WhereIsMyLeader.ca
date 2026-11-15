import { DateTime } from 'luxon';
import { TIMEZONE } from '../config.js';

/** Current time in the service's timezone. */
export function now() {
  return DateTime.now().setZone(TIMEZONE);
}

/** Formats a luxon DateTime as yyyy-MM-dd. */
export function toDateString(dateTime) {
  return dateTime.toFormat('yyyy-MM-dd');
}

/** Whole days from dateStrA to dateStrB (both yyyy-MM-dd). */
export function getDaysBetween(dateStrA, dateStrB) {
  return Math.round(DateTime.fromISO(dateStrB).diff(DateTime.fromISO(dateStrA), 'days').days);
}

/** Adds (or subtracts) days to a yyyy-MM-dd string. */
export function addDays(dateStr, days) {
  return DateTime.fromISO(dateStr).plus({ days }).toISODate();
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

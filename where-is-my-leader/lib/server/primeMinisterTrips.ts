import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';

import type { TravelPoint } from '@/lib/types';

export interface TripRow {
  id: number;
  city: string;
  lat: number | null;
  lng: number | null;
  arrival: string;
  departure: string;
  short_summary: string | null;
  long_summary: string | null;
  citations: string | null;
  desc: string | null;
}

const NO_DATA = 'No data available.';

function parseCitations(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

export function rowToTravelPoint(row: TripRow): TravelPoint {
  const desc = row.desc?.trim();
  return {
    id: row.id,
    city: row.city,
    coords: [row.lat || 0, row.lng || 0],
    arrival: row.arrival,
    departure: row.departure,
    desc: row.long_summary?.trim() || desc || NO_DATA,
    summary: row.short_summary?.trim() || desc || NO_DATA,
    citations: parseCitations(row.citations),
  };
}

function dataFile(name: string): string {
  // In production the data directory is mounted at /app/data; locally it lives next to the project.
  return process.env.NODE_ENV === 'production'
    ? path.join('/app/data', name)
    : path.resolve('../shared-data', name);
}

function readTripsFromDatabase(dbPath: string): TravelPoint[] {
  const db = new Database(dbPath, { readonly: true });
  try {
    const rows = db
      .prepare(
        `SELECT id, city, lat, lng, arrival, departure, short_summary, long_summary, citations, desc
         FROM aggregated_trips
         ORDER BY arrival ASC`
      )
      .all() as TripRow[];
    return rows.map(rowToTravelPoint);
  } finally {
    db.close();
  }
}

/**
 * The Prime Minister's trips from the SQLite database, falling back to a JSON export when the
 * database is missing. Returns null when neither exists.
 */
export function loadPrimeMinisterTrips(): TravelPoint[] | null {
  const dbPath = dataFile('trips.db');
  if (fs.existsSync(dbPath)) return readTripsFromDatabase(dbPath);

  console.warn('Database not found. Executing JSON fallback.');
  const jsonPath = dataFile('trips_fallback.json');
  if (!fs.existsSync(jsonPath)) return null;
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as TravelPoint[];
}

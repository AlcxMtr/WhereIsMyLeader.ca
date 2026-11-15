import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

import { findSubject, resolveSubject } from '@/lib/subjects';

import { extendLastTripTo, loadLeaderTrips } from './leaderTrips';
import { readTripsFromDatabase, rowToTravelPoint, type TripRow } from './sqliteTrips';

const row = (overrides: Partial<TripRow> = {}): TripRow => ({
  id: 7,
  city: 'Paris, France',
  lat: 48.85,
  lng: 2.35,
  arrival: '2025-05-10',
  departure: '2025-05-12',
  short_summary: '  Short  ',
  long_summary: '  Long  ',
  citations: '["https://example.com"]',
  desc: ' fallback ',
  ...overrides,
});

describe('rowToTravelPoint', () => {
  it('prefers the long/short summaries and trims them', () => {
    expect(rowToTravelPoint(row())).toMatchObject({ desc: 'Long', summary: 'Short', coords: [48.85, 2.35] });
  });

  it('falls back to desc, then to a placeholder', () => {
    const fallback = rowToTravelPoint(row({ long_summary: null, short_summary: null }));
    expect([fallback.desc, fallback.summary]).toEqual(['fallback', 'fallback']);
    expect(rowToTravelPoint(row({ long_summary: null, short_summary: null, desc: null })).desc).toBe('No data available.');
  });

  it('tolerates missing coordinates and malformed citations', () => {
    const point = rowToTravelPoint(row({ lat: null, lng: null, citations: 'not json' }));
    expect(point.coords).toEqual([0, 0]);
    expect(point.citations).toEqual([]);
  });
});

describe('readTripsFromDatabase', () => {
  it('reads aggregated_trips ordered by arrival', () => {
    const dbPath = path.join(os.tmpdir(), `wiml-test-${Date.now()}.db`);
    const db = new Database(dbPath);
    db.exec(`
      CREATE TABLE aggregated_trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT, lat REAL, lng REAL, arrival TEXT, departure TEXT,
        short_summary TEXT, long_summary TEXT, citations JSON, desc TEXT
      );
    `);
    db.prepare(
      'INSERT INTO aggregated_trips (city, lat, lng, arrival, departure, short_summary, long_summary, citations, desc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run('Berlin, Germany', 52.52, 13.4, '2025-06-10', '2025-06-11', 'Short B', 'Long B', '[]', 'Desc B');
    db.prepare(
      'INSERT INTO aggregated_trips (city, lat, lng, arrival, departure, short_summary, long_summary, citations, desc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run('Ottawa, Canada', 45.42, -75.69, '2025-05-01', '2025-05-02', 'Short A', 'Long A', '["https://example.com"]', 'Desc A');
    db.close();

    try {
      const trips = readTripsFromDatabase(dbPath);
      expect(trips.map(t => t.city)).toEqual(['Ottawa, Canada', 'Berlin, Germany']);
      expect(trips[0].citations).toEqual(['https://example.com']);
    } finally {
      fs.rmSync(dbPath, { force: true });
    }
  });
});

describe('subjects and leaderTrips', () => {
  it('extends only the final trip to today without mutating the source', () => {
    const trips = [
      { ...rowToTravelPoint(row({ id: 1 })) },
      { ...rowToTravelPoint(row({ id: 2, departure: '2025-06-01' })) },
    ];
    const extended = extendLastTripTo(trips, '2026-01-01');
    expect(extended.map(t => t.departure)).toEqual(['2025-05-12', '2026-01-01']);
    expect(trips[1].departure).toBe('2025-06-01');
  });

  it('resolves subjects by id or display name and defaults omitted input to carney', () => {
    expect(findSubject('carney')?.name).toBe('Mark Carney');
    expect(findSubject('Mark Carney')?.id).toBe('carney');
    expect(findSubject('andrewdeng')?.name).toBe('Andrew Deng');
    expect(findSubject('Andrew Deng')?.id).toBe('andrewdeng');
    expect(findSubject('trump')?.name).toBe('Donald Trump');
    expect(findSubject('Donald Trump')?.id).toBe('trump');
    expect(findSubject('Nobody')).toBeNull();
    expect(resolveSubject(undefined).id).toBe('carney');
  });

  it('loads trips for registered people by id or name and returns null for unknown', () => {
    expect(loadLeaderTrips('andrewdeng')?.length).toBeGreaterThan(0);
    expect(loadLeaderTrips('Andrew Deng')?.length).toBeGreaterThan(0);
    expect(loadLeaderTrips('Nobody')).toBeNull();
  });
});

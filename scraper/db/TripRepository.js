import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    stop_order INTEGER,
    location TEXT,
    itinerary JSON,
    lat REAL,
    lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, stop_order)
  );

  CREATE TABLE IF NOT EXISTS aggregated_trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT,
    lat REAL,
    lng REAL,
    arrival TEXT,
    departure TEXT,
    short_summary TEXT,
    long_summary TEXT,
    citations JSON,
    desc TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

/**
 * Owns the SQLite connection and every SQL statement used by the scraper.
 * - `trips`: one row per scraped stop (raw data).
 * - `aggregated_trips`: consecutive stops in the same city merged into a single stay.
 */
export class TripRepository {
  constructor(dbPath) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.exec(SCHEMA);

    this.stmts = {
      upsertTrip: this.db.prepare(`
        INSERT INTO trips (date, stop_order, location, itinerary, lat, lng)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(date, stop_order) DO UPDATE SET
          location = excluded.location,
          itinerary = excluded.itinerary,
          lat = excluded.lat,
          lng = excluded.lng
      `),
      hasTripsForDate: this.db.prepare('SELECT 1 FROM trips WHERE date = ? LIMIT 1'),
      tripsInRange: this.db.prepare('SELECT date, itinerary, location FROM trips WHERE date >= ? AND date <= ?'),

      findAggregate: this.db.prepare(`
        SELECT id, arrival, departure FROM aggregated_trips
        WHERE city = ? AND arrival = ? AND departure = ?
        LIMIT 1
      `),
      latestAggregate: this.db.prepare('SELECT * FROM aggregated_trips ORDER BY id DESC LIMIT 1'),
      aggregatesByDeparture: this.db.prepare('SELECT * FROM aggregated_trips WHERE departure = ?'),
      insertAggregate: this.db.prepare(
        'INSERT INTO aggregated_trips (city, lat, lng, arrival, departure) VALUES (?, ?, ?, ?, ?)'
      ),
      updateAggregateDeparture: this.db.prepare('UPDATE aggregated_trips SET departure = ? WHERE id = ?'),
      updateAggregateSummary: this.db.prepare(
        'UPDATE aggregated_trips SET short_summary = ?, long_summary = ?, citations = ?, desc = ? WHERE id = ?'
      ),
    };
  }

  // ---- trips ----

  upsertTrip({ date, stopOrder, location, activities, lat, lng }) {
    this.stmts.upsertTrip.run(date, stopOrder, location, JSON.stringify(activities), lat, lng);
  }

  hasTripsForDate(date) {
    return Boolean(this.stmts.hasTripsForDate.get(date));
  }

  /** @returns {Array<{date: string, location: string, activities: string[]}>} */
  getTripsInRange(startDate, endDate) {
    return this.stmts.tripsInRange.all(startDate, endDate).map(row => ({
      date: row.date,
      location: row.location,
      activities: JSON.parse(row.itinerary),
    }));
  }

  // ---- aggregated_trips ----

  /** Finds a single-day aggregate for this city on this exact date. */
  findSingleDayAggregate(city, date) {
    return this.stmts.findAggregate.get(city, date, date);
  }

  getLatestAggregate() {
    return this.stmts.latestAggregate.get();
  }

  getAggregatesEndingOn(date) {
    return this.stmts.aggregatesByDeparture.all(date);
  }

  /** @returns {number} id of the new row */
  insertAggregate({ city, lat, lng, arrival, departure }) {
    return this.stmts.insertAggregate.run(city, lat, lng, arrival, departure).lastInsertRowid;
  }

  updateAggregateDeparture(id, departure) {
    this.stmts.updateAggregateDeparture.run(departure, id);
  }

  updateAggregateSummary(id, { shortSummary, longSummary, citations, desc }) {
    this.stmts.updateAggregateSummary.run(shortSummary, longSummary, JSON.stringify(citations || []), desc, id);
  }

  close() {
    this.db.close();
  }
}

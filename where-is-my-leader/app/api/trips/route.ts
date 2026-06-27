import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const dynamic = 'force-dynamic';

interface Trip {
  id: number;
  city: string;
  coords: [number, number];
  arrival: string;
  departure: string;
  desc: string;
}

function normalizeLocation(loc: string): string {
  if (!loc) return "";
  return loc
    .toLowerCase()
    .replace(/['’]/g, "") 
    .replace(/[^\w\s]/g, "") 
    .trim();
}

function getPrimaryCity(loc: string): string {
  if (!loc) return "";
  return loc.split('/')[0].trim();
}

// Helper to calculate exact calendar date gaps without timezone shift leakage
function getDaysBetween(dateStrA: string, dateStrB: string): number {
  // Appending T00:00:00 treats the date as absolute local time rather than implicit UTC midnight
  const dateA = new Date(`${dateStrA}T00:00:00`);
  const dateB = new Date(`${dateStrB}T00:00:00`);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dateB.getTime() - dateA.getTime()) / msPerDay);
}

// Helper to modify an absolute calendar date by offset days
function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export async function GET() {
  try {
    const isDocker = process.env.NODE_ENV === 'production';
    const dbPath = isDocker 
      ? path.join('/app/data', 'trips.db') 
      : path.resolve('../shared-data/trips.db');

    const db = new Database(dbPath, { readonly: true });

    // CRITICAL FIX 1: Sort explicitly by date AND stop_order sequentially
    const rows = db.prepare(`
      SELECT date, location, activities, lat, lng 
      FROM trips 
      ORDER BY date ASC, stop_order ASC
    `).all() as { date: string, location: string, activities: string, lat: number | null, lng: number | null }[];

    db.close();

    if (rows.length === 0) {
      return NextResponse.json([]);
    }

    const aggregatedTrips: Trip[] = [];
    let currentTrip: Trip | null = null;
    let tripIdCounter = 1;

    for (const row of rows) {
      let parsedActivities: string[] = [];
      try {
        parsedActivities = JSON.parse(row.activities);
      } catch (e) {
        parsedActivities = [row.activities]; 
      }

      const dailyDesc = parsedActivities.join('. ') + '.';
      const rawPrimaryCity = getPrimaryCity(row.location);
      const normalizedRowCity = normalizeLocation(rawPrimaryCity);

      if (!currentTrip) {
        currentTrip = {
          id: tripIdCounter++,
          city: rawPrimaryCity,
          coords: [row.lat || 0, row.lng || 0], 
          arrival: row.date,
          departure: row.date,
          desc: dailyDesc
        };
      } else {
        const normalizedCurrentCity = normalizeLocation(currentTrip.city);

        if (normalizedCurrentCity === normalizedRowCity) {
          // Same location: extend the stay duration
          currentTrip.departure = row.date;
          if (!currentTrip.desc.includes(dailyDesc)) {
              currentTrip.desc += ` ${dailyDesc}`;
          }
        } else {
          // Location changed! First check if there is an unlogged weekend gap to bridge
          const gapDays = getDaysBetween(currentTrip.departure, row.date);
          
          if (gapDays > 1) {
            // CRITICAL FIX 3: Forward-fill the previous trip up to the day before the new stop
            currentTrip.departure = addDays(row.date, -1);
          }

          // Commit finished trip item to stack
          aggregatedTrips.push(currentTrip);

          // Spawn new tracking point object
          currentTrip = {
            id: tripIdCounter++,
            city: rawPrimaryCity,
            coords: [row.lat || 0, row.lng || 0],
            arrival: row.date,
            departure: row.date,
            desc: dailyDesc
          };
        }
      }
    }

    if (currentTrip) {
      aggregatedTrips.push(currentTrip);
    }

    return NextResponse.json(aggregatedTrips);

  } catch (error: unknown) {
    console.error("Database Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      { error: "Failed to fetch trips data", details: errorMessage }, 
      { status: 500 }
    );
  }
}
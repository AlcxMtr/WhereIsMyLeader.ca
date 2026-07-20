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

export async function GET() {
  try {
    const isDocker = process.env.NODE_ENV === 'production';
    const dbPath = isDocker 
      ? path.join('/app/data', 'trips.db') 
      : path.resolve('../shared-data/trips.db');

    const db = new Database(dbPath, { readonly: true });

    // The logic is now pre-compiled in the new aggregated_trips table
    const rows = db.prepare(`
      SELECT id, city, lat, lng, arrival, departure, desc 
      FROM aggregated_trips 
      ORDER BY id ASC
    `).all() as { id: number, city: string, lat: number | null, lng: number | null, arrival: string, departure: string, desc: string }[];

    db.close();

    if (rows.length === 0) {
      return NextResponse.json([]);
    }

    // Map the flat SQL columns to the nested frontend JSON interface
const aggregatedTrips: Trip[] = rows.map(row => ({
      id: row.id,
      city: row.city,
      coords: [row.lat || 0, row.lng || 0],
      arrival: row.arrival,
      departure: row.departure,
      // FIX: Add a safe fallback so a NULL database field won't crash the server
      desc: row.desc ? row.desc.trim() : "No data available."
    }));

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
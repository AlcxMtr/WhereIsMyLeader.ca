import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

interface Trip {
  id: number;
  city: string;
  coords: [number, number];
  arrival: string;
  departure: string;
  desc: string;
  summary: string;
  citations: string[];
}

export async function GET() {
  try {
    const isDocker = process.env.NODE_ENV === 'production';
    
    // Define paths for both data sources
    const dbPath = isDocker 
      ? path.join('/app/data', 'trips.db') 
      : path.resolve('../shared-data/trips.db');
      
    const jsonPath = isDocker
      ? path.join('/app/data', 'trips_fallback.json')
      : path.resolve('../shared-data/trips_fallback.json');

    // 1. Intercept execution if the database is missing
    if (!fs.existsSync(dbPath)) {
      console.warn("Database not found. Executing JSON fallback.");
      
      if (!fs.existsSync(jsonPath)) {
        return NextResponse.json(
          { error: "Fatal: Database and fallback JSON are both missing." }, 
          { status: 404 }
        );
      }

      // Read and return the JSON file directly
      const fallbackData = fs.readFileSync(jsonPath, 'utf8');
      return NextResponse.json(JSON.parse(fallbackData));
    }

    // 2. Proceed with DB connection ONLY if the file exists
    const db = new Database(dbPath, { readonly: true });

    const rows = db.prepare(`
      SELECT id, city, lat, lng, arrival, departure, short_summary, long_summary, citations, desc 
      FROM aggregated_trips 
      ORDER BY arrival ASC
    `).all() as { 
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
    }[];

    db.close();

    if (rows.length === 0) {
      return NextResponse.json([]);
    }

    const aggregatedTrips: Trip[] = rows.map(row => {
      let parsedCitations: string[] = [];
      if (row.citations) {
        try {
          parsedCitations = JSON.parse(row.citations);
        } catch {
          parsedCitations = [];
        }
      }

      // Use long_summary for desc if present; otherwise fall back to pre-compiled desc/itinerary
      const finalDesc = row.long_summary ? row.long_summary.trim() : (row.desc ? row.desc.trim() : "No data available.");
      const finalSummary = row.short_summary ? row.short_summary.trim() : (row.desc ? row.desc.trim() : "No data available.");

      return {
        id: row.id,
        city: row.city,
        coords: [row.lat || 0, row.lng || 0],
        arrival: row.arrival,
        departure: row.departure,
        desc: finalDesc,
        summary: finalSummary,
        citations: parsedCitations,
      };
    });

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
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DateTime } from 'luxon';
import { scrapeSingleDay } from './scrapeService.js';

// 1. Database Connection
const isDocker = process.env.NODE_ENV === 'production';
const dbDir = isDocker ? '/app/data' : path.resolve('../shared-data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'trips.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    stop_order INTEGER,
    location TEXT,
    activities JSON,
    lat REAL,
    lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, stop_order)
  )
`);

const insertTrip = db.prepare(`
  INSERT INTO trips (date, stop_order, location, activities, lat, lng) 
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(date, stop_order) DO UPDATE SET 
    location = excluded.location,
    activities = excluded.activities,
    lat = excluded.lat,
    lng = excluded.lng
`);

// 2. The Time-Traveling Loop
async function runBackfill() {
  let currentDay = DateTime.fromISO('2025-05-02').setZone('America/Toronto');
  const today = DateTime.now().setZone('America/Toronto');

  console.log(`Starting backfill from ${currentDay.toISODate()} to ${today.toISODate()}...\n`);

  const offsetPriority = [1, 0, 2, 3];

  while (currentDay <= today) {
    const dateString = currentDay.toFormat('yyyy-MM-dd');
    console.log(`[${dateString}] Fetching...`);
    
    const eventWeekday = currentDay.toFormat('cccc').toLowerCase();
    const eventMonth = currentDay.toFormat('LLLL').toLowerCase();
    const eventDay = currentDay.toFormat('d');
    const eventYear = currentDay.toFormat('yyyy');

    let success = false;

    for (const offset of offsetPriority) {
      const publishDay = currentDay.minus({ days: offset });
      
      const pubYear = publishDay.toFormat('yyyy');
      const pubMonth = publishDay.toFormat('MM');
      const pubDay = publishDay.toFormat('dd');

      const url = `https://www.pm.gc.ca/en/news/media-advisories/${pubYear}/${pubMonth}/${pubDay}/${eventWeekday}-${eventMonth}-${eventDay}-${eventYear}`;
      
      // Pass the insertTrip statement directly into the imported service
      success = await scrapeSingleDay(url, dateString, insertTrip);
      
      if (success) {
        break; 
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!success) {
      console.log(` -> Skip: No itinerary found after checking offsets: ${offsetPriority.join(', ')} days prior.`);
    }

    await new Promise(resolve => setTimeout(resolve, 2500));
    currentDay = currentDay.plus({ days: 1 });
  }

  console.log("\n✅ Backfill complete! You now have historical data.");
}

runBackfill();
import cron from 'node-cron';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DateTime } from 'luxon';
import { scrapeSingleDay } from './scrapeService.js';

// 1. Database Connection
const isDocker = process.env.NODE_ENV === 'production';
const dbDir = isDocker ? '/app/data' : path.resolve('../shared-data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

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
    lng = excluded.lng,
    created_at = CURRENT_TIMESTAMP
`);

// 2. Daily Scrape Execution with Fallback Logic
async function executeDailyScrape() {
  const today = DateTime.now().setZone('America/Toronto');
  const dateString = today.toFormat('yyyy-MM-dd');
  console.log(`\n[${new Date().toISOString()}] Executing daily scrape for ${dateString}...`);
  
  const eventWeekday = today.toFormat('cccc').toLowerCase();
  const eventMonth = today.toFormat('LLLL').toLowerCase();
  const eventDay = today.toFormat('d');
  const eventYear = today.toFormat('yyyy');

  const offsetPriority = [1, 0, 2, 3];
  let success = false;

  for (const offset of offsetPriority) {
    const publishDay = today.minus({ days: offset });
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
    console.log(` -> Skip: No itinerary found for today after checking fallback offsets.`);
  }
}

console.log("Scraper microservice initialized. Waiting for 8:00 PM Toronto time...");

// Run every day at 20:00 (8:00 PM)
cron.schedule('0 20 * * *', () => {
  executeDailyScrape();
}, {
  timezone: "America/Toronto"
});

// Run once on startup to ensure current day is captured
executeDailyScrape();
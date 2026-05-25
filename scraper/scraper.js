import axios from 'axios';
import * as cheerio from 'cheerio';
import cron from 'node-cron';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DateTime } from 'luxon';

const isDocker = process.env.NODE_ENV === 'production';
const dbDir = isDocker ? '/app/data' : path.resolve('../shared-data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'trips.db');
const db = new Database(dbPath);

// Updated Schema to include lat and lng
db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE,
    location TEXT,
    activities JSON,
    lat REAL,
    lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Updated Insert Statement
const insertTrip = db.prepare(`
  INSERT INTO trips (date, location, activities, lat, lng) 
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(date) DO UPDATE SET 
    location = excluded.location,
    activities = excluded.activities,
    lat = excluded.lat,
    lng = excluded.lng,
    created_at = CURRENT_TIMESTAMP
`);

function generateTodayTarget() {
  // 1. Get the current time strictly in Toronto
  const today = DateTime.now().setZone('America/Toronto');
  
  // 2. Calculate yesterday for the Drupal publish path
  const yesterday = today.minus({ days: 1 });

  // 3. Format the publish path (YYYY/MM/DD)
  const pubYear = yesterday.toFormat('yyyy');
  const pubMonth = yesterday.toFormat('MM');
  const pubDay = yesterday.toFormat('dd');

  // 4. Format the slug (dayofweek-month-day-year)
  const eventWeekday = today.toFormat('cccc').toLowerCase(); // 'sunday'
  const eventMonth = today.toFormat('LLLL').toLowerCase();   // 'march'
  const eventDay = today.toFormat('d');                      // '29' (no leading zero)
  const eventYear = today.toFormat('yyyy');                  // '2026'

  // Construct the final URL
  const dynamicUrl = `https://www.pm.gc.ca/en/news/media-advisories/${pubYear}/${pubMonth}/${pubDay}/${eventWeekday}-${eventMonth}-${eventDay}-${eventYear}`;
  
  // The clean string for your SQLite database
  const dbDateString = today.toFormat('yyyy-MM-dd');

  return { url: dynamicUrl, dateString: dbDateString };
}

// Geocoding Function using OpenStreetMap Nominatim
async function getCoordinates(locationString) {
  // If the PM travels to multiple cities in one day (e.g. "Oslo / London"), 
  // we'll just map the primary destination (the first one) to avoid complex multi-point logic.
  const primaryCity = locationString.split('/')[0].trim();
  
  try {
    // Nominatim strictly requires a descriptive User-Agent
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: primaryCity, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'WhereIsMyLeader.ca - Scraper Bot (contact@alexmtr.com)' }
    });
    
    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      };
    }
  } catch (error) {
    console.error(`Geocoding failed for "${primaryCity}":`, error.message);
  }
  
  // Return nulls if not found so we don't accidentally map to [0,0] (which is in the ocean)
  return { lat: null, lng: null };
}

async function scrapeSingleDay(url, dateString) {
  console.log(`[${new Date().toISOString()}] Scraping: ${url}`);

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    const container = $('article .field--name-body').first();
    if (!container.length) throw new Error("Could not find article body.");

    let location = "Unknown Location";
    let activities = [];

    container.children().each((i, el) => {
        const tagName = el.name ? el.name.toLowerCase() : '';
        const text = $(el).text().replace(/\s+/g, ' ').trim(); 
        
        if (!text) return; 
        
        const lowerText = text.toLowerCase();
        if (
            lowerText.includes('note: all times local') ||
            lowerText.includes('note for media') || 
            lowerText.includes('notes for media') || 
            lowerText.includes('open coverage') ||
            lowerText.includes('pooled photo opportunity') ||
            lowerText.includes('closed to media') ||
            lowerText.includes('media are asked to arrive') ||
            lowerText.includes('media@pmo-cpm.gc.ca')
        ) {
            return;
        }

        if (tagName === 'h2') {
            if (location === "Unknown Location") {
                location = text;
            } else if (!location.includes(text)) {
                location += ` / ${text}`;
            }
        } else if (tagName === 'p') {
            activities.push(text);
        }
    });

    // HARDCODE FIX: Stop Ottawa from being teleported to the Philippines
    location = location.replace(/National Capital Region/gi, 'Ottawa');
    // 4. Fetch the coordinates before saving
    let lat = null;
    let lng = null;
    if (location !== "Unknown Location") {
        const coords = await getCoordinates(location);
        lat = coords.lat;
        lng = coords.lng;
        // Respect Nominatim's strict rate limit (1 request per second)
        await new Promise(resolve => setTimeout(resolve, 1500)); 
    }

    // Save to SQLite including coordinates
    insertTrip.run(dateString, location, JSON.stringify(activities), lat, lng);
    console.log(`Successfully saved data for ${dateString} to SQLite with coords [${lat}, ${lng}].`);

} catch (error) {
    // Check if the error is specifically a 404 Not Found
    if (error.response && error.response.status === 404) {
      console.log(`[Skip] No itinerary published yet for ${dateString} (404 Not Found). Database not updated.`);
    } else {
      // Log actual unexpected errors (like the site being down, or Cheerio failing)
      console.error(`[Error] Scrape Failed for ${dateString}. Reason: ${error.message}`);
    }
  }
}

console.log("Scraper microservice initialized. Waiting for 8:00 PM Toronto time...");

// Run every day at 20:00 (8:00 PM)
cron.schedule('0 20 * * *', () => {
  const target = generateTodayTarget();
  scrapeSingleDay(target.url, target.dateString);
}, {
  timezone: "America/Toronto"
});

// Optional: You can still run it once on startup immediately to test it
const initialTarget = generateTodayTarget();
scrapeSingleDay(initialTarget.url, initialTarget.dateString);
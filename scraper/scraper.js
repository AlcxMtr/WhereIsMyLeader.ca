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

// Schema updated: Removed UNIQUE from date, added UNIQUE(date, location) composite key
db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    location TEXT,
    activities JSON,
    lat REAL,
    lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, location)
  )
`);

// Insert updated to check for composite conflict
const insertTrip = db.prepare(`
  INSERT INTO trips (date, location, activities, lat, lng) 
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(date, location) DO UPDATE SET 
    activities = excluded.activities,
    lat = excluded.lat,
    lng = excluded.lng,
    created_at = CURRENT_TIMESTAMP
`);

function generateTodayTarget() {
  const today = DateTime.now().setZone('America/Toronto');
  const yesterday = today.minus({ days: 1 });

  const pubYear = yesterday.toFormat('yyyy');
  const pubMonth = yesterday.toFormat('MM');
  const pubDay = yesterday.toFormat('dd');

  const eventWeekday = today.toFormat('cccc').toLowerCase(); 
  const eventMonth = today.toFormat('LLLL').toLowerCase();   
  const eventDay = today.toFormat('d');                      
  const eventYear = today.toFormat('yyyy');                  

  const dynamicUrl = `https://www.pm.gc.ca/en/news/media-advisories/${pubYear}/${pubMonth}/${pubDay}/${eventWeekday}-${eventMonth}-${eventDay}-${eventYear}`;
  const dbDateString = today.toFormat('yyyy-MM-dd');

  return { url: dynamicUrl, dateString: dbDateString };
}

async function getCoordinates(locationString) {
  const primaryCity = locationString.split('/')[0].trim();
  
  try {
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
  
  return { lat: null, lng: null };
}

async function scrapeSingleDay(url, dateString) {
  console.log(`[${new Date().toISOString()}] Scraping: ${url}`);

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    const container = $('article .field--name-body').first();
    if (!container.length) throw new Error("Could not find article body.");

    // Array to hold multiple locations per day
    let stops = [];
    let currentStop = null;

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
            // Push the previous stop to the array before starting a new one
            if (currentStop) {
                stops.push(currentStop);
            }
            let cleanLocation = text.replace(/National Capital Region/gi, 'Ottawa');
            currentStop = { location: cleanLocation, activities: [] };
        } else if (tagName === 'p') {
            // Fallback if activities appear before any location header
            if (!currentStop) {
                currentStop = { location: "Unknown Location", activities: [] };
            }
            currentStop.activities.push(text);
        }
    });

    // Push the final stop to the array
    if (currentStop) {
        stops.push(currentStop);
    }

    // Process each geographic stop individually
    for (const stop of stops) {
        let lat = null;
        let lng = null;
        
        if (stop.location !== "Unknown Location") {
            const coords = await getCoordinates(stop.location);
            lat = coords.lat;
            lng = coords.lng;
            await new Promise(resolve => setTimeout(resolve, 1500)); 
        }

        insertTrip.run(dateString, stop.location, JSON.stringify(stop.activities), lat, lng);
        console.log(`Successfully saved data for ${dateString} - ${stop.location} to SQLite with coords [${lat}, ${lng}].`);
    }

  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`[Skip] No itinerary published yet for ${dateString} (404 Not Found). Database not updated.`);
    } else {
      console.error(`[Error] Scrape Failed for ${dateString}. Reason: ${error.message}`);
    }
  }
}

console.log("Scraper microservice initialized. Waiting for 8:00 PM Toronto time...");

cron.schedule('0 20 * * *', () => {
  const target = generateTodayTarget();
  scrapeSingleDay(target.url, target.dateString);
}, {
  timezone: "America/Toronto"
});

const initialTarget = generateTodayTarget();
scrapeSingleDay(initialTarget.url, initialTarget.dateString);
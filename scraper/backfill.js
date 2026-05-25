import axios from 'axios';
import * as cheerio from 'cheerio';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DateTime } from 'luxon';

// 1. Database Connection
const isDocker = process.env.NODE_ENV === 'production';
const dbDir = isDocker ? '/app/data' : path.resolve('../shared-data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'trips.db');
const db = new Database(dbPath);

const insertTrip = db.prepare(`
  INSERT INTO trips (date, location, activities, lat, lng) 
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(date) DO UPDATE SET 
    location = excluded.location,
    activities = excluded.activities,
    lat = excluded.lat,
    lng = excluded.lng
`);

// 2. Geocoding
async function getCoordinates(locationString) {
  const primaryCity = locationString.split('/')[0].trim();
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: primaryCity, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'WhereIsMyLeader.ca - Scraper Bot' }
    });
    if (response.data && response.data.length > 0) {
      return { lat: parseFloat(response.data[0].lat), lng: parseFloat(response.data[0].lon) };
    }
  } catch (error) {
    console.error(`Geocoding failed for "${primaryCity}"`);
  }
  return { lat: null, lng: null };
}

// 3. The Core Scrape Function
async function scrapeSingleDay(url, dateString) {
  console.log(`[${dateString}] Fetching...`);
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const container = $('article .field--name-body').first();
    if (!container.length) return;

    let location = "Unknown Location";
    let activities = [];

    container.children().each((i, el) => {
        const tagName = el.name ? el.name.toLowerCase() : '';
        const text = $(el).text().replace(/\s+/g, ' ').trim(); 
        if (!text) return; 
        
        const lowerText = text.toLowerCase();
        if (lowerText.includes('note: all times local') || lowerText.includes('note for media') || lowerText.includes('closed to media')) return;

        if (tagName === 'h2') {
            if (location === "Unknown Location") location = text;
            else if (!location.includes(text)) location += ` / ${text}`;
        } else if (tagName === 'p') {
            activities.push(text);
        }
    });

    // HARDCODE FIX: Stop Ottawa from being teleported to the Philippines
    location = location.replace(/National Capital Region/gi, 'Ottawa');
    let lat = null, lng = null;
    if (location !== "Unknown Location") {
        const coords = await getCoordinates(location);
        lat = coords.lat; lng = coords.lng;
    }

    insertTrip.run(dateString, location, JSON.stringify(activities), lat, lng);
    console.log(` -> Saved: ${location}`);

  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(` -> Skip: No public itinerary published for this date.`);
    } else {
      console.error(` -> Error: ${error.message}`);
    }
  }
}

// 4. The Time-Traveling Loop
async function runBackfill() {
  // Start at Jan 1, 2026
  let currentDay = DateTime.fromISO('2026-01-01').setZone('America/Toronto');
  const today = DateTime.now().setZone('America/Toronto');

  console.log(`Starting backfill from ${currentDay.toISODate()} to ${today.toISODate()}...\n`);

  while (currentDay <= today) {
    const yesterday = currentDay.minus({ days: 1 });
    
    // Generate Drupal URL components
    const pubYear = yesterday.toFormat('yyyy');
    const pubMonth = yesterday.toFormat('MM');
    const pubDay = yesterday.toFormat('dd');
    const eventWeekday = currentDay.toFormat('cccc').toLowerCase();
    const eventMonth = currentDay.toFormat('LLLL').toLowerCase();
    const eventDay = currentDay.toFormat('d');
    const eventYear = currentDay.toFormat('yyyy');

    const url = `https://www.pm.gc.ca/en/news/media-advisories/${pubYear}/${pubMonth}/${pubDay}/${eventWeekday}-${eventMonth}-${eventDay}-${eventYear}`;
    const dateString = currentDay.toFormat('yyyy-MM-dd');

    await scrapeSingleDay(url, dateString);

    // CRITICAL: Sleep for 2.5 seconds to avoid IP bans from the Gov or Nominatim
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Move to the next day
    currentDay = currentDay.plus({ days: 1 });
  }

  console.log("\n✅ Backfill complete! You now have historical data.");
}

runBackfill();
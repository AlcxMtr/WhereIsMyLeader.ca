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

// Updated SQL statement to target the composite key constraint matching the scraper
const insertTrip = db.prepare(`
  INSERT INTO trips (date, location, activities, lat, lng) 
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(date, location) DO UPDATE SET 
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
      headers: { 'User-Agent': 'WhereIsMyLeader.ca - Scraper Bot (contact@alexmtr.com)' }
    });
    if (response.data && response.data.length > 0) {
      return { lat: parseFloat(response.data[0].lat), lng: parseFloat(response.data[0].lon) };
    }
  } catch (error) {
    console.error(`Geocoding failed for "${primaryCity}":`, error.message);
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
            if (currentStop) {
                stops.push(currentStop);
            }
            let cleanLocation = text.replace(/National Capital Region/gi, 'Ottawa');
            currentStop = { location: cleanLocation, activities: [] };
        } else if (tagName === 'p') {
            if (!currentStop) {
                currentStop = { location: "Unknown Location", activities: [] };
            }
            currentStop.activities.push(text);
        }
    });

    if (currentStop) {
        stops.push(currentStop);
    }

    // Process and insert each parsed stop sequentially
    for (const stop of stops) {
        let lat = null;
        let lng = null;
        
        if (stop.location !== "Unknown Location") {
            const coords = await getCoordinates(stop.location);
            lat = coords.lat; 
            lng = coords.lng;
            // Throttling delay strictly for Nominatim rate limits on multi-stop days
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        insertTrip.run(dateString, stop.location, JSON.stringify(stop.activities), lat, lng);
        console.log(` -> Saved: ${stop.location} [${lat}, ${lng}]`);
    }

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
  // TODO: Should be March 14, 2025
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

    // Sleep for 2.5 seconds to avoid IP bans from the Government firewall
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Move to the next day
    currentDay = currentDay.plus({ days: 1 });
  }

  console.log("\n✅ Backfill complete! You now have historical data.");
}

runBackfill();
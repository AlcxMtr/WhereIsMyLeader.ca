import axios from 'axios';
import * as cheerio from 'cheerio';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DateTime } from 'luxon';
import { summarizeItinerary } from './aiService.js';

// 1. Database Singleton Initialization
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
    summary TEXT,
    citations JSON,
    desc TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const insertTrip = db.prepare(`
  INSERT INTO trips (date, stop_order, location, itinerary, lat, lng) 
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(date, stop_order) DO UPDATE SET 
    location = excluded.location,
    itinerary = excluded.itinerary,
    lat = excluded.lat,
    lng = excluded.lng
`);

// 2. Helper Functions
function normalizeLocation(loc) {
  if (!loc) return "";
  return loc.toLowerCase().replace(/['’]/g, "").replace(/[^\w\s]/g, "").trim();
}

function getPrimaryCity(loc) {
  if (!loc) return "";
  return loc.split('/')[0].trim();
}

function getDaysBetween(dateStrA, dateStrB) {
  const dateA = new Date(`${dateStrA}T00:00:00`);
  const dateB = new Date(`${dateStrB}T00:00:00`);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dateB.getTime() - dateA.getTime()) / msPerDay);
}

function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export async function getCoordinates(locationString) {
  const primaryCity = getPrimaryCity(locationString);
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

// 3. String Compiler for the Frontend Description
function buildDescription(summary, citations, mappedItineraries) {
  if (!summary || summary === "null" || summary.includes("null")) {
    // Fallback: output the raw daily itineraries
    return mappedItineraries.map(t => {
      const acts = t.activities.length > 0 
        ? t.activities.map(act => {
            const cleanAct = act.trim();
            return cleanAct.endsWith('.') ? cleanAct : `${cleanAct}.`;
          }).join('\n') 
        : 'No public itinerary events listed.';
      return t.activities.length > 1 ? `[${t.date}]\n${acts}` : acts;
    }).join('\n\n') + '\n\n';
  }

  let content = summary;

  if (citations && citations.length > 0) {
    content += '\n\nSources:\n' + citations.map((url, i) => `[${i + 1}] ${url}`).join('\n');
  }
  
  return content + '\n\n';
}

// 4. The Incremental Aggregation Engine
async function syncAggregatedTrip(dateString, fullLocation, lat, lng) {
  const rawPrimaryCity = getPrimaryCity(fullLocation);
  const normalizedRowCity = normalizeLocation(rawPrimaryCity);

  // Check if a journey matching these temporal anchors already exists inside our aggregated storage data
  const exactDuplicate = db.prepare(`
    SELECT id, arrival, departure FROM aggregated_trips 
    WHERE city = ? AND arrival = ? AND departure = ?
    LIMIT 1
  `).get(rawPrimaryCity, dateString, dateString);

  let targetAggId;
  let arrival;
  let departure = dateString;

  if (exactDuplicate) {
    // FIX: exact twin item found, anchor target update variables seamlessly onto it
    targetAggId = exactDuplicate.id;
    arrival = exactDuplicate.arrival;
  } else {
    // Standard matching progression rules continue below...
    const lastAgg = db.prepare('SELECT * FROM aggregated_trips ORDER BY id DESC LIMIT 1').get();

    if (lastAgg && normalizeLocation(lastAgg.city) === normalizedRowCity) {
      targetAggId = lastAgg.id;
      arrival = lastAgg.arrival;
      db.prepare('UPDATE aggregated_trips SET departure = ? WHERE id = ?').run(departure, targetAggId);
    } else {
      if (lastAgg) {
        const gapDays = getDaysBetween(lastAgg.departure, dateString);
        if (gapDays > 1 && gapDays <= 4) {
          const bridgedDeparture = addDays(dateString, -1);
          db.prepare('UPDATE aggregated_trips SET departure = ? WHERE id = ?').run(bridgedDeparture, lastAgg.id);
        }
      }
      arrival = dateString;
      const info = db.prepare('INSERT INTO aggregated_trips (city, lat, lng, arrival, departure) VALUES (?, ?, ?, ?, ?)')
        .run(rawPrimaryCity, lat, lng, arrival, departure);
      targetAggId = info.lastInsertRowid;
    }
  }

  // Fetch all raw daily rows connected to this specific multi-day stay
  const rawTrips = db.prepare(`SELECT date, itinerary, location FROM trips WHERE date >= ? AND date <= ?`)
    .all(arrival, departure);

  const matchingTrips = rawTrips.filter(t => normalizeLocation(getPrimaryCity(t.location)) === normalizedRowCity);
  const mappedItineraries = matchingTrips.map(t => ({
    date: t.date,
    activities: JSON.parse(t.itinerary)
  }));

  let aiResponse = { summary: "null", citations: [] };
  
  try {
    aiResponse = await summarizeItinerary(arrival, departure, fullLocation, mappedItineraries);
  } catch (error) {
    console.warn(`[Warning] AI Summarization failed for ${fullLocation}. Falling back to raw itinerary. Reason: ${error.message}`);
  }

  const finalSummary = aiResponse.summary.includes("null") ? null : aiResponse.summary;
  const citationsJson = JSON.stringify(aiResponse.citations);
  const compiledDesc = buildDescription(finalSummary, aiResponse.citations, mappedItineraries);

  db.prepare('UPDATE aggregated_trips SET summary = ?, citations = ?, desc = ? WHERE id = ?')
    .run(finalSummary, citationsJson, compiledDesc, targetAggId);
}

// 5. The Scraper Controller
async function scrapeSingleDay(url, dateString) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const container = $('article .field--name-body').first();
    
    if (!container.length) return true; 

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
            lowerText.includes('note to media') || 
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
            if (currentStop) stops.push(currentStop);
            let cleanLocation = text
                .replace(/National Capital Region(?:,\s*Canada)?/gi, 'Ottawa, Ontario')
                .replace(/Ottawa,\s*Canada/gi, 'Ottawa, Ontario');
            currentStop = { location: cleanLocation, activities: [] };
        } else if (tagName === 'p') {
            if (!currentStop) currentStop = { location: "Unknown Location", activities: [] };
            currentStop.activities.push(text);
        }
    });

    if (currentStop) stops.push(currentStop);

    for (let index = 0; index < stops.length; index++) {
        const stop = stops[index];
        let lat = null;
        let lng = null;
        
        if (stop.location !== "Unknown Location") {
            const coords = await getCoordinates(stop.location);
            lat = coords.lat; 
            lng = coords.lng;
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        const itineraryJson = JSON.stringify(stop.activities);
        insertTrip.run(dateString, index, stop.location, itineraryJson, lat, lng);
        console.log(` -> Saved Raw: Stop ${index} - ${stop.location}`);

        // Sync and re-summarize this aggregated stay block
        await syncAggregatedTrip(dateString, stop.location, lat, lng);
    }

    return true; 

  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false; 
    } else {
      console.error(` -> Error processing ${url}: ${error.message}`);
      return false;
    }
  }
}

export async function processDate(targetDateTime) {
  const dateString = targetDateTime.toFormat('yyyy-MM-dd');
  console.log(`[${dateString}] Fetching...`);
  
  const eventWeekday = targetDateTime.toFormat('cccc').toLowerCase();
  const eventMonth = targetDateTime.toFormat('LLLL').toLowerCase();
  const eventDay = targetDateTime.toFormat('d');
  const eventYear = targetDateTime.toFormat('yyyy');

  const offsetPriority = [1, 0, 2, 3];
  let success = false;

  for (const offset of offsetPriority) {
    const publishDay = targetDateTime.minus({ days: offset });
    const pubYear = publishDay.toFormat('yyyy');
    const pubMonth = publishDay.toFormat('MM');
    const pubDay = publishDay.toFormat('dd');

    const url = `https://www.pm.gc.ca/en/news/media-advisories/${pubYear}/${pubMonth}/${pubDay}/${eventWeekday}-${eventMonth}-${eventDay}-${eventYear}`;
    success = await scrapeSingleDay(url, dateString);
    
    if (success) break; 
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (!success) console.log(` -> Skip: No itinerary found.`);
}

export async function performTwoDayLookback() {
  const targetDate = DateTime.now().setZone('America/Toronto').minus({ days: 2 }).toFormat('yyyy-MM-dd');
  console.log(`\n[Lookback Engine] Scanning for closed journeys ending on ${targetDate}...`);

  // Target any aggregated stay that officially concluded exactly 2 days ago
  const tripsToUpdate = db.prepare(`SELECT * FROM aggregated_trips WHERE departure = ?`).all(targetDate);

  if (tripsToUpdate.length === 0) {
    console.log(` -> No completed trips found ending on ${targetDate}.`);
    return;
  }

  for (const agg of tripsToUpdate) {
    console.log(` -> Re-summarizing Final Record: ${agg.city} (${agg.arrival} to ${agg.departure})`);
    
    // Pull the raw data block to feed to the AI
    const rawTrips = db.prepare(`SELECT date, itinerary, location FROM trips WHERE date >= ? AND date <= ?`).all(agg.arrival, agg.departure);
    const normalizedRowCity = normalizeLocation(agg.city);
    const matchingTrips = rawTrips.filter(t => normalizeLocation(getPrimaryCity(t.location)) === normalizedRowCity);
    
    const mappedItineraries = matchingTrips.map(t => ({
        date: t.date,
        activities: JSON.parse(t.itinerary)
    }));

    const originalLocationStr = matchingTrips[0]?.location || agg.city;

    const aiResponse = await summarizeItinerary(agg.arrival, agg.departure, originalLocationStr, mappedItineraries);
    
    const finalSummary = aiResponse.summary === "null" ? null : aiResponse.summary;
    const citationsJson = JSON.stringify(aiResponse.citations);
    const compiledDesc = buildDescription(finalSummary, aiResponse.citations, mappedItineraries);
    
    db.prepare(`UPDATE aggregated_trips SET summary = ?, citations = ?, desc = ? WHERE id = ?`)
      .run(finalSummary, citationsJson, compiledDesc, agg.id);
  }
}
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function getCoordinates(locationString) {
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

export async function scrapeSingleDay(url, dateString, insertTripStatement) {
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
            // Standardize Ottawa/National Capital Region entries into a single canonical string
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

        // Execute the SQL statement passed from the parent file
        insertTripStatement.run(dateString, index, stop.location, JSON.stringify(stop.activities), lat, lng);
        console.log(` -> Saved: Stop ${index} - ${stop.location} [${lat}, ${lng}]`);
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
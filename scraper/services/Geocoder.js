import axios from 'axios';
import { getPrimaryCity } from '../utils/text.js';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const AI_SYSTEM_PROMPT =
  "You are a factual, precise geographic coordinate resolver. You output exclusively in JSON format.";

function buildAiPrompt(location) {
  return `
    You are a highly precise geographic coordinate resolver.
    Find the exact latitude and longitude for the following location: "${location}".
    
    TASK:
    Return the coordinates strictly in the following JSON format. You MUST return valid JSON matching this exact schema:
    {
      "lat": 46.4356,
      "lng": -63.0761
    }
    
    STRICT CONSTRAINTS:
    - If the location is completely fictional or impossible to locate, return {"lat": null, "lng": null}.
    - Do not include conversational filler, introductory text, or markdown formatting. Output ONLY the JSON object.
    - Use decimal degrees.
  `;
}

/** Parses a coordinate, keeping valid zeros and rejecting null/garbage. */
function toCoordinate(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

const NO_COORDS = Object.freeze({ lat: null, lng: null });

/**
 * Resolves a location string to coordinates.
 * Tries OpenStreetMap (Nominatim) first, then falls back to AI for obscure landmarks.
 */
export class Geocoder {
  /**
   * @param {import('./PerplexityClient.js').PerplexityClient} aiClient
   * @param {{userAgent: string}} options
   */
  constructor(aiClient, { userAgent }) {
    this.ai = aiClient;
    this.userAgent = userAgent;
  }

  /** @returns {Promise<{lat: number | null, lng: number | null}>} */
  async geocode(location) {
    const osmCoords = await this.#geocodeWithNominatim(getPrimaryCity(location));
    if (osmCoords) return osmCoords;

    console.log(`[Geocoding Fallback] Nominatim failed for "${location}". Triggering AI resolution...`);
    const aiCoords = await this.#geocodeWithAI(location);
    if (aiCoords) {
      console.log(` -> AI successfully resolved ${location} to [${aiCoords.lat}, ${aiCoords.lng}]`);
      return aiCoords;
    }

    console.warn(`[Geocoding Exhausted] Could not resolve coordinates for: ${location}`);
    return { ...NO_COORDS };
  }

  async #geocodeWithNominatim(query) {
    try {
      const { data } = await axios.get(NOMINATIM_URL, {
        params: { q: query, format: 'json', limit: 1 },
        headers: { 'User-Agent': this.userAgent },
      });
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (error) {
      console.error(`Nominatim Geocoding failed for "${query}":`, error.message);
    }
    return null;
  }

  async #geocodeWithAI(location) {
    try {
      const { data } = await this.ai.completeJson({
        systemPrompt: AI_SYSTEM_PROMPT,
        userPrompt: buildAiPrompt(location),
        temperature: 0.1,
      });
      const lat = toCoordinate(data.lat);
      const lng = toCoordinate(data.lng);
      return lat !== null && lng !== null ? { lat, lng } : null;
    } catch (error) {
      console.error(`[AI Geocode Error] Failed to resolve ${location}:`, error.message);
      return null;
    }
  }
}

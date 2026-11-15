import axios from 'axios';
import * as cheerio from 'cheerio';
import { sleep } from '../utils/dates.js';

export const UNKNOWN_LOCATION = "Unknown Location";

// Paragraphs containing any of these are media logistics, not itinerary events.
const MEDIA_NOTE_MARKERS = [
  'note: all times local',
  'note for media',
  'note to media',
  'notes for media',
  'open coverage',
  'pooled photo opportunity',
  'closed to media',
  'media are asked to arrive',
  'media@pmo-cpm.gc.ca',
];

// Advisories are usually published the day before the event, sometimes same day or earlier.
const PUBLISH_OFFSET_PRIORITY = [1, 0, 2, 3];

function isMediaNote(text) {
  const lower = text.toLowerCase();
  return MEDIA_NOTE_MARKERS.some(marker => lower.includes(marker));
}

function cleanLocation(text) {
  return text
    .replace(/National Capital Region(?:,\s*Canada)?/gi, 'Ottawa, Ontario')
    .replace(/Ottawa,\s*Canada/gi, 'Ottawa, Ontario');
}

/**
 * Parses a PMO media advisory page into ordered stops.
 * Each <h2> starts a new stop (location); following <p> elements are its activities.
 * @returns {Array<{location: string, activities: string[]}>}
 */
export function parseAdvisoryHtml(html) {
  const $ = cheerio.load(html);
  const container = $('article .field--name-body').first();
  if (!container.length) return [];

  const stops = [];
  let currentStop = null;

  container.children().each((_, el) => {
    const tagName = el.name ? el.name.toLowerCase() : '';
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (!text || isMediaNote(text)) return;

    if (tagName === 'h2') {
      if (currentStop) stops.push(currentStop);
      currentStop = { location: cleanLocation(text), activities: [] };
    } else if (tagName === 'p') {
      if (!currentStop) currentStop = { location: UNKNOWN_LOCATION, activities: [] };
      currentStop.activities.push(text);
    }
  });

  if (currentStop) stops.push(currentStop);
  return stops;
}

/**
 * Finds and downloads the PMO media advisory for a given event date.
 */
export class AdvisoryScraper {
  constructor({ baseUrl, retryDelayMs }) {
    this.baseUrl = baseUrl;
    this.retryDelayMs = retryDelayMs;
  }

  /**
   * Tries the likely publish dates in priority order.
   * @param {import('luxon').DateTime} eventDate
   * @returns {Promise<Array<{location: string, activities: string[]}> | null>}
   *   The parsed stops (possibly empty), or null if no advisory was found.
   */
  async fetchStops(eventDate) {
    for (const offset of PUBLISH_OFFSET_PRIORITY) {
      const url = this.#buildUrl(eventDate, eventDate.minus({ days: offset }));
      const html = await this.#fetchPage(url);
      if (html !== null) return parseAdvisoryHtml(html);
      await sleep(this.retryDelayMs);
    }
    return null;
  }

  #buildUrl(eventDate, publishDate) {
    const slug = [
      eventDate.toFormat('cccc'),
      eventDate.toFormat('LLLL'),
      eventDate.toFormat('d'),
      eventDate.toFormat('yyyy'),
    ].join('-').toLowerCase();
    return `${this.baseUrl}/${publishDate.toFormat('yyyy/MM/dd')}/${slug}`;
  }

  /** @returns {Promise<string | null>} page HTML, or null on 404/error */
  async #fetchPage(url) {
    try {
      const { data } = await axios.get(url);
      return data;
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error(` -> Error processing ${url}: ${error.message}`);
      }
      return null;
    }
  }
}

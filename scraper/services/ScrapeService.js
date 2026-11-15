import { now, sleep, toDateString } from '../utils/dates.js';
import { UNKNOWN_LOCATION } from './AdvisoryScraper.js';

/**
 * Orchestrates the daily pipeline:
 * scrape advisory -> geocode stops -> save raw trips -> update aggregated stays.
 */
export class ScrapeService {
  /**
   * @param {object} deps
   * @param {import('../db/TripRepository.js').TripRepository} deps.repo
   * @param {import('./AdvisoryScraper.js').AdvisoryScraper} deps.scraper
   * @param {import('./Geocoder.js').Geocoder} deps.geocoder
   * @param {import('./TripAggregator.js').TripAggregator} deps.aggregator
   * @param {number} deps.geocodeDelayMs
   */
  constructor({ repo, scraper, geocoder, aggregator, geocodeDelayMs }) {
    this.repo = repo;
    this.scraper = scraper;
    this.geocoder = geocoder;
    this.aggregator = aggregator;
    this.geocodeDelayMs = geocodeDelayMs;
  }

  isDateProcessed(dateTime) {
    return this.repo.hasTripsForDate(toDateString(dateTime));
  }

  /** Scrapes and stores the itinerary for a single day. */
  async processDate(dateTime) {
    const date = toDateString(dateTime);
    console.log(`[${date}] Fetching...`);

    const stops = await this.scraper.fetchStops(dateTime);
    if (stops === null) {
      console.log(` -> Skip: No itinerary found.`);
      return;
    }

    try {
      for (const [index, stop] of stops.entries()) {
        await this.#saveStop(date, index, stop);
      }
    } catch (error) {
      console.error(` -> Error processing stops for ${date}: ${error.message}`);
    }
  }

  /** Re-summarizes stays that ended two days ago, giving news coverage time to appear. */
  async performTwoDayLookback() {
    const targetDate = toDateString(now().minus({ days: 2 }));
    console.log(`\n[Lookback Engine] Scanning for closed journeys ending on ${targetDate}...`);
    await this.aggregator.finalizeStaysEndingOn(targetDate);
  }

  /** Full daily job: today's scrape plus the lookback pass. */
  async runDaily() {
    await this.processDate(now());
    await this.performTwoDayLookback();
  }

  close() {
    this.repo.close();
  }

  async #saveStop(date, index, stop) {
    let coords = { lat: null, lng: null };
    if (stop.location !== UNKNOWN_LOCATION) {
      coords = await this.geocoder.geocode(stop.location);
      await sleep(this.geocodeDelayMs);
    }

    this.repo.upsertTrip({
      date,
      stopOrder: index,
      location: stop.location,
      activities: stop.activities,
      ...coords,
    });
    console.log(` -> Saved Raw: Stop ${index} - ${stop.location}`);

    await this.aggregator.addStop(date, stop.location, coords.lat, coords.lng);
  }
}

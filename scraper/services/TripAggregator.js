import { addDays, getDaysBetween } from '../utils/dates.js';
import { cleanSummary, getPrimaryCity, isSameCity, normalizeLocation } from '../utils/text.js';

// Gaps of up to this many days between two stays are bridged by extending the previous stay.
const MAX_BRIDGED_GAP_DAYS = 4;

/** Compiles the detailed frontend description from raw daily itineraries. */
function buildDescription(itineraries) {
  return itineraries.map(day => {
    const acts = day.activities.length > 0
      ? day.activities.map(act => {
          const clean = act.trim();
          return clean.endsWith('.') ? clean : `${clean}.`;
        }).join('\n')
      : 'No public itinerary events listed.';
    return itineraries.length > 1 ? `[${day.date}]\n${acts}` : acts;
  }).join('\n\n') + '\n\n';
}

/**
 * Merges raw daily stops into `aggregated_trips` (one row per stay in a city)
 * and keeps each stay's AI summary and description up to date.
 */
export class TripAggregator {
  /**
   * @param {import('../db/TripRepository.js').TripRepository} repo
   * @param {import('./ItinerarySummarizer.js').ItinerarySummarizer} summarizer
   */
  constructor(repo, summarizer) {
    this.repo = repo;
    this.summarizer = summarizer;
  }

  /** Incrementally folds a newly scraped stop into the aggregated stays. */
  async addStop(date, fullLocation, lat, lng) {
    const city = getPrimaryCity(fullLocation);
    const { id, arrival } = this.#findOrCreateStay(city, date, lat, lng);
    await this.#refreshSummary(id, city, arrival, date, fullLocation);
  }

  /** Re-summarizes stays that ended on `date`, once news coverage has caught up. */
  async finalizeStaysEndingOn(date) {
    const stays = this.repo.getAggregatesEndingOn(date);
    if (stays.length === 0) {
      console.log(` -> No completed trips found ending on ${date}.`);
      return;
    }

    for (const stay of stays) {
      console.log(` -> Re-summarizing Final Record: ${stay.city} (${stay.arrival} to ${stay.departure})`);
      await this.#refreshSummary(stay.id, stay.city, stay.arrival, stay.departure);
    }
  }

  /** @returns {{id: number, arrival: string}} the stay this date belongs to */
  #findOrCreateStay(city, date, lat, lng) {
    const duplicate = this.repo.findSingleDayAggregate(city, date);
    if (duplicate) return { id: duplicate.id, arrival: duplicate.arrival };

    const last = this.repo.getLatestAggregate();

    // Same city as the latest stay: extend it.
    if (last && normalizeLocation(last.city) === normalizeLocation(city)) {
      this.repo.updateAggregateDeparture(last.id, date);
      return { id: last.id, arrival: last.arrival };
    }

    // New city: close small gaps by extending the previous stay up to the day before.
    if (last) {
      const gapDays = getDaysBetween(last.departure, date);
      if (gapDays > 1 && gapDays <= MAX_BRIDGED_GAP_DAYS) {
        this.repo.updateAggregateDeparture(last.id, addDays(date, -1));
      }
    }

    const id = this.repo.insertAggregate({ city, lat, lng, arrival: date, departure: date });
    return { id, arrival: date };
  }

  async #refreshSummary(stayId, city, arrival, departure, locationLabel) {
    const itineraries = this.repo
      .getTripsInRange(arrival, departure)
      .filter(trip => isSameCity(trip.location, city));

    const label = locationLabel ?? itineraries[0]?.location ?? city;

    let ai = { longSummary: null, shortSummary: null, citations: [] };
    try {
      ai = await this.summarizer.summarize(arrival, departure, label, itineraries);
    } catch (error) {
      console.warn(`[Warning] AI Summarization failed for ${label}. Falling back to raw itinerary. Reason: ${error.message}`);
    }

    this.repo.updateAggregateSummary(stayId, {
      shortSummary: cleanSummary(ai.shortSummary),
      longSummary: cleanSummary(ai.longSummary),
      citations: ai.citations,
      desc: buildDescription(itineraries),
    });
  }
}

import {
  ADVISORY_BASE_URL, AI_DEBUG_LOG_PATH, DB_PATH, DELAYS, PERPLEXITY, USER_AGENT,
} from './config.js';
import { TripRepository } from './db/TripRepository.js';
import { PerplexityClient } from './services/PerplexityClient.js';
import { ItinerarySummarizer } from './services/ItinerarySummarizer.js';
import { Geocoder } from './services/Geocoder.js';
import { AdvisoryScraper } from './services/AdvisoryScraper.js';
import { TripAggregator } from './services/TripAggregator.js';
import { ScrapeService } from './services/ScrapeService.js';

/** Composition root: wires all dependencies together. */
export function createScrapeService() {
  const repo = new TripRepository(DB_PATH);
  const ai = new PerplexityClient(PERPLEXITY);

  return new ScrapeService({
    repo,
    scraper: new AdvisoryScraper({ baseUrl: ADVISORY_BASE_URL, retryDelayMs: DELAYS.betweenUrlAttempts }),
    geocoder: new Geocoder(ai, { userAgent: USER_AGENT }),
    aggregator: new TripAggregator(repo, new ItinerarySummarizer(ai, AI_DEBUG_LOG_PATH)),
    geocodeDelayMs: DELAYS.afterGeocode,
  });
}

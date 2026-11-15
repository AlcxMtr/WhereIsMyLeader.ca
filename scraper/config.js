import path from 'path';

// Central configuration for the scraper service.
const isProduction = process.env.NODE_ENV === 'production';

export const DATA_DIR = isProduction ? '/app/data' : path.resolve('../shared-data');
export const DB_PATH = path.join(DATA_DIR, 'trips.db');
export const AI_DEBUG_LOG_PATH = path.join(DATA_DIR, 'ai_debug.log');

export const TIMEZONE = 'America/Toronto';
export const DAILY_CRON = '0 20 * * *'; // 8:00 PM Toronto time

export const USER_AGENT = 'WhereIsMyLeader.ca - Scraper Bot (contact@alexmtr.com)';
export const ADVISORY_BASE_URL = 'https://www.pm.gc.ca/en/news/media-advisories';

export const PERPLEXITY = {
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',
  model: 'sonar',
};

// Throttling delays (ms) to stay polite with upstream services
export const DELAYS = {
  betweenUrlAttempts: 1000,
  afterGeocode: 1500,
  betweenBackfillDays: 2500,
};

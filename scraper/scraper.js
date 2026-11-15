import cron from 'node-cron';
import { DAILY_CRON, TIMEZONE } from './config.js';
import { createScrapeService } from './bootstrap.js';
import { now, toDateString } from './utils/dates.js';

const service = createScrapeService();

console.log("Scraper microservice initialized. Waiting for 8:00 PM Toronto time...");

cron.schedule(DAILY_CRON, async () => {
  console.log(`\n[${new Date().toISOString()}] Executing scheduled daily scrape...`);
  await service.runDaily();
}, { timezone: TIMEZONE });

// Run once on startup, unless today's data has already been scraped.
const today = now();
if (service.isDateProcessed(today)) {
  console.log(`[Startup Skip] Data for today (${toDateString(today)}) already scraped. Skipping startup run.`);
} else {
  console.log("[Startup Execute] Running initial scrape for today...");
  await service.runDaily();
}

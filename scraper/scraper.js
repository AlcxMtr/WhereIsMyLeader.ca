import cron from 'node-cron';
import { EVENING_CRON, POLL_CRON, TIMEZONE } from './config.js';
import { createScrapeService } from './bootstrap.js';
import { now, toDateString } from './utils/dates.js';

const service = createScrapeService();

console.log("Scraper microservice initialized. Schedule (America/Toronto): polls at 2 AM, 5 AM, 8 AM, 11 AM, 2 PM, 5 PM; wrap-up at 8 PM.");

cron.schedule(POLL_CRON, async () => {
  console.log(`\n[${new Date().toISOString()}] Executing scheduled daytime poll...`);
  await service.pollToday();
}, { timezone: TIMEZONE });

cron.schedule(EVENING_CRON, async () => {
  console.log(`\n[${new Date().toISOString()}] Executing scheduled 8 PM wrap-up...`);
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

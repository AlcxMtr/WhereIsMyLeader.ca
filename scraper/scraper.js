import cron from 'node-cron';
import { DateTime } from 'luxon';
import { processDate, performTwoDayLookback } from './scrapeService.js';

console.log("Scraper microservice initialized. Waiting for 8:00 PM Toronto time...");

cron.schedule('0 20 * * *', async () => {
  console.log(`\n[${new Date().toISOString()}] Executing scheduled daily scrape...`);
  const today = DateTime.now().setZone('America/Toronto');
  
  // 1. Scrape the upcoming/current itinerary and generate initial summary
  await processDate(today);

  // 2. Look back 2 days and update historical summaries with fresh news context
  await performTwoDayLookback();

}, {
  timezone: "America/Toronto"
});

// Run once on startup
(async () => {
  const startupDay = DateTime.now().setZone('America/Toronto');
  await processDate(startupDay);
  await performTwoDayLookback();
})();
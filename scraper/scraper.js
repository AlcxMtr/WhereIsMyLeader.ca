import cron from 'node-cron';
import { DateTime } from 'luxon';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { processDate, performTwoDayLookback } from './scrapeService.js';

console.log("Scraper microservice initialized. Waiting for 8:00 PM Toronto time...");

cron.schedule('0 20 * * *', async () => {
  console.log(`\n[${new Date().toISOString()}] Executing scheduled daily scrape...`);
  const today = DateTime.now().setZone('America/Toronto');
  
  await processDate(today);
  await performTwoDayLookback();
}, {
  timezone: "America/Toronto"
});

// Run once on startup (with an guards verifying today's data loop doesn't exist)
(async () => {
  const isDocker = process.env.NODE_ENV === 'production';
  const dbPath = isDocker ? '/app/data/trips.db' : path.resolve('../shared-data/trips.db');
  
  if (fs.existsSync(dbPath)) {
    const db = new Database(dbPath, { readonly: true });
    const todayStr = DateTime.now().setZone('America/Toronto').toFormat('yyyy-MM-dd');
    
    // Check if raw data has records logged for today already
    const existing = db.prepare('SELECT 1 FROM trips WHERE date = ? LIMIT 1').get(todayStr);
    db.close();

    if (existing) {
      console.log(`[Startup Skip] Data for today (${todayStr}) already localized. Suppressing extra initialization execution.`);
      return;
    }
  }

  console.log("[Startup Execute] Localizing current snapshot sequence variables...");
  const startupDay = DateTime.now().setZone('America/Toronto');
  await processDate(startupDay);
  await performTwoDayLookback();
})();
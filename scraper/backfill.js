// let currentDay = DateTime.fromISO('2026-07-05').setZone('America/Toronto');
import { DateTime } from 'luxon';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { processDate } from './scrapeService.js';

// 1. Establish lightweight database connection for record skipping checks
const isDocker = process.env.NODE_ENV === 'production';
const dbPath = isDocker ? '/app/data/trips.db' : path.resolve('../shared-data/trips.db');

let db = null;
if (fs.existsSync(dbPath)) {
  db = new Database(dbPath, { readonly: true });
}

async function runBackfill() {
  // 2. Parse command line arguments for a dynamic start date
  // Expected usage: node backfill.js 2026-05-01
  const argDate = process.argv[2];
  let currentDay;

  if (argDate) {
    const parsed = DateTime.fromISO(argDate).setZone('America/Toronto');
    if (parsed.isValid) {
      currentDay = parsed;
    } else {
      console.error(`❌ Invalid date format provided: "${argDate}". Please use YYYY-MM-DD format.`);
      process.exit(1);
    }
  } else {
    // Graceful fallback default if no command line parameter is specified
    currentDay = DateTime.fromISO('2026-07-05').setZone('America/Toronto');
  }

  const today = DateTime.now().setZone('America/Toronto');

  console.log(`Starting backfill from ${currentDay.toISODate()} to ${today.toISODate()}...\n`);

  while (currentDay <= today) {
    const dateString = currentDay.toFormat('yyyy-MM-dd');

    // 3. Skip check logic execution
    if (db) {
      const alreadyProcessed = db.prepare('SELECT 1 FROM trips WHERE date = ? LIMIT 1').get(dateString);
      if (alreadyProcessed) {
        console.log(`[Skip] ${dateString} has already been logged. Continuing loop...`);
        currentDay = currentDay.plus({ days: 1 });
        continue; // Immediately jump to the next calendar day, skipping scraper/AI payloads
      }
    }

    // 4. Process missing dates sequentially
    await processDate(currentDay);

    // Mandatory throttling delay to avoid IP blocks from the Government firewall
    await new Promise(resolve => setTimeout(resolve, 2500));
    currentDay = currentDay.plus({ days: 1 });
  }

  // Close read connection safely
  if (db) db.close();
  console.log("\n✅ Backfill complete! You now have historical data.");
}

runBackfill();
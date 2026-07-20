import { DateTime } from 'luxon';
import { processDate } from './scrapeService.js';

async function runBackfill() {
  let currentDay = DateTime.fromISO('2025-05-02').setZone('America/Toronto');
  const today = DateTime.now().setZone('America/Toronto');

  console.log(`Starting backfill from ${currentDay.toISODate()} to ${today.toISODate()}...\n`);

  while (currentDay <= today) {
    await processDate(currentDay);

    // Mandatory delay to avoid rate limits when looping rapidly
    await new Promise(resolve => setTimeout(resolve, 2500));
    currentDay = currentDay.plus({ days: 1 });
  }

  console.log("\n✅ Backfill complete! You now have historical data.");
}

runBackfill();
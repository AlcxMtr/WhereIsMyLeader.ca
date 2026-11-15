// Usage: node backfill.js [YYYY-MM-DD]
// Scrapes every day from the given start date up to today, skipping days already stored.
import { DateTime } from 'luxon';
import { DELAYS, TIMEZONE } from './config.js';
import { createScrapeService } from './bootstrap.js';
import { now, sleep, toDateString } from './utils/dates.js';

const DEFAULT_START_DATE = '2026-07-05';

function parseStartDate(arg) {
  const parsed = DateTime.fromISO(arg ?? DEFAULT_START_DATE).setZone(TIMEZONE);
  if (!parsed.isValid) {
    console.error(`❌ Invalid date format provided: "${arg}". Please use YYYY-MM-DD format.`);
    process.exit(1);
  }
  return parsed;
}

async function runBackfill() {
  const service = createScrapeService();
  const today = now();
  let day = parseStartDate(process.argv[2]);

  console.log(`Starting backfill from ${day.toISODate()} to ${today.toISODate()}...\n`);

  for (; day <= today; day = day.plus({ days: 1 })) {
    if (service.isDateProcessed(day)) {
      console.log(`[Skip] ${toDateString(day)} has already been logged. Continuing loop...`);
      continue;
    }

    await service.processDate(day);
    // Mandatory throttling delay to avoid IP blocks from the Government firewall
    await sleep(DELAYS.betweenBackfillDays);
  }

  service.close();
  console.log("\n✅ Backfill complete! You now have historical data.");
}

runBackfill();

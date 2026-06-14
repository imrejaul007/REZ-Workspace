import logger from './utils/logger';

/**
 * Migration: 05_FM01_booking_source_casing
 * Bug: FM-01 (07-FORENSIC-ENUM)
 * Risk: MEDIUM — underscore → dot casing for BookingSource enum
 *
 * Problem: BookingSource stored as 'table_booking', 'online_booking', etc.
 * (underscore casing) but the canonical enum uses dot casing:
 * 'table.booking', 'online.booking', 'app.booking', 'web.booking'.
 *
 * Fix: Normalize all booking sources to dot-cased format.
 *
 * Rollback: Restore underscore casing.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb+srv://work_db_user:RmptskyDLFNSJGCA@cluster0.ku78x6g.mongodb.net/rez-app?retryWrites=true&w=majority';

const DRY_RUN = process.env.DRY_RUN !== 'false';

// Mapping: underscore → dot
const UNDERSCORE_TO_DOT = {
  table_booking: 'table.booking',
  online_booking: 'online.booking',
  app_booking: 'app.booking',
  web_booking: 'web.booking',
  phone_booking: 'phone.booking',
  walkin_booking: 'walkin.booking',
  third_party: 'third.party',
  api_booking: 'api.booking',
};

async function up(client) {
  const db = client.db();

  // Find collections that might have booking source
  const collections = ['bookings', 'orders', 'transactions', 'paymentLogs'];
  let totalUpdated = 0;

  for (const collName of collections) {
    const coll = db.collection(collName);

    // Check if source field exists
    const sample = await coll.findOne({ source: { $exists: true } });
    if (!sample) continue;

    logger.info(`\n=== Collection: ${collName} ===`);

    // Count by source type
    const dist = await coll.aggregate([
      { $match: { source: { $exists: true } } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    logger.info(`  Total with source: ${await coll.countDocuments({ source: { $exists: true } })}`);
    logger.info('  Distribution:');
    dist.forEach(({ _id, count }) => {
      const willChange = UNDERSCORE_TO_DOT[_id] ? ` → ${UNDERSCORE_TO_DOT[_id]}` : '';
      logger.info(`    "${_id}": ${count}${willChange}`);
    });

    if (DRY_RUN) continue;

    // Apply updates
    for (const [underscore, dot] of Object.entries(UNDERSCORE_TO_DOT)) {
      const result = await coll.updateMany(
        { source: underscore },
        {
          $set: {
            source: dot,
            migratedAt: new Date(),
            migrationId: '05_FM01_booking_source_casing',
          },
        },
      );
      if (result.modifiedCount > 0) {
        logger.info(`  ${underscore} → ${dot}: ${result.modifiedCount}`);
        totalUpdated += result.modifiedCount;
      }
    }
  }

  if (DRY_RUN) {
    logger.info('\n[DRY RUN] Set DRY_RUN=false to apply changes.');
    return;
  }

  logger.info(`\n=== MIGRATION COMPLETE ===`);
  logger.info(`  Total documents updated: ${totalUpdated}`);
}

async function down(client) {
  const db = client.db();
  const DOT_TO_UNDERSCORE = Object.fromEntries(
    Object.entries(UNDERSCORE_TO_DOT).map(([k, v]) => [v, k])
  );

  const collections = ['bookings', 'orders', 'transactions', 'paymentLogs'];
  let totalRolledBack = 0;

  logger.info('\n=== ROLLBACK ===');

  if (DRY_RUN) {
    for (const collName of collections) {
      const count = await db.collection(collName).countDocuments({
        migrationId: '05_FM01_booking_source_casing',
      });
      if (count > 0) logger.info(`  ${collName}: ${count} to rollback`);
    }
    logger.info('Set DRY_RUN=false to apply rollback.');
    return;
  }

  for (const collName of collections) {
    const coll = db.collection(collName);
    for (const [dot, underscore] of Object.entries(DOT_TO_UNDERSCORE)) {
      const result = await coll.updateMany(
        { source: dot, migrationId: '05_FM01_booking_source_casing' },
        {
          $set: { source: underscore },
          $unset: { migratedAt: '', migrationId: '' },
        },
      );
      totalRolledBack += result.modifiedCount;
    }
  }
  logger.info(`  Rolled back: ${totalRolledBack}`);
}

async function main() {
  const action = process.argv[2] || 'up';
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    logger.info(`\n=== Migration: 05_FM01_booking_source_casing ===`);
    logger.info(`Action: ${action}`);
    logger.info(`Dry run: ${DRY_RUN}`);

    if (action === 'up') await up(client);
    else if (action === 'down') await down(client);
    else { logger.error('Usage: node 05_FM01_...js [up|down]'); process.exit(1); }
  } finally {
    await client.close();
  }
}

main().catch(err => { console.error('Migration failed:', err); process.exit(1); });

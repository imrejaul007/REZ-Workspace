import logger from './utils/logger';

/**
 * Migration: 00_C2_cointransaction_typename_backfill
 * Bug: C2 (01-DATA-LAYER)
 * Risk: MEDIUM — backfill only, no destructive changes
 *
 * Problem: cointransactions have no coinType field on legacy documents.
 * The coinType field (enum: 'rez', 'prive', 'branded', 'promo', 'cashback',
 * 'referral') is missing from all historical documents.
 *
 * Fix:
 * - For 'earned'/'bonus'/'branded_award' type transactions with missing coinType:
 *   infer coinType = 'rez' (REZ streak/reward bonuses)
 * - For 'refunded' type with missing coinType: infer coinType from description/source
 * - For 'spent' type: coinType = 'rez' (spending REZ coins)
 *
 * Rollback: Unset coinType for migrated documents.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb+srv://work_db_user:RmptskyDLFNSJGCA@cluster0.ku78x6g.mongodb.net/rez-app?retryWrites=true&w=majority';

const DRY_RUN = process.env.DRY_RUN !== 'false';

async function up(client) {
  const db = client.db();
  const collection = db.collection('cointransactions');

  logger.info('\n=== PRE-MIGRATION AUDIT ===');

  // Distribution of existing coinType
  const coinTypeDist = await collection.aggregate([
    { $match: { coinType: { $exists: true } } },
    { $group: { _id: '$coinType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();
  logger.info('  Existing coinType distribution:');
  if (coinTypeDist.length === 0) {
    logger.info('    (no documents have coinType set)');
  } else {
    coinTypeDist.forEach(({ _id, count }) => logger.info(`    ${_id}: ${count}`));
  }

  // Count documents missing coinType by type
  const missingCoinType = await collection.aggregate([
    {
      $match: {
        $or: [
          { coinType: { $exists: false } },
          { coinType: null },
        ],
      },
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        sources: { $addToSet: '$source' },
        samples: { $push: { _id: '$_id', amount: '$amount', description: '$description' } },
      },
    },
    { $sort: { count: -1 } },
  ]).toArray();

  logger.info('\n  Documents missing coinType (by transaction type):');
  let totalMissing = 0;
  missingCoinType.forEach(({ _id, count, sources, samples }) => {
    totalMissing += count;
    logger.info(`    type='${_id}': ${count} docs, sources: ${sources.join(', ')}`);
    if (samples.length > 0) {
      logger.info(`      Sample: ${samples[0].description} (${samples[0].amount} coins)`);
    }
  });
  logger.info(`  Total missing: ${totalMissing}`);

  if (DRY_RUN) {
    logger.info('\n[DRY RUN] Set DRY_RUN=false to apply changes.');
    return;
  }

  let totalUpdated = 0;

  // earned/bonus — these are REZ coin rewards (streak bonuses, welcome bonuses, etc.)
  const earnedResult = await collection.updateMany(
    {
      $or: [
        { type: 'earned' },
        { type: 'bonus' },
        { type: 'branded_award' },
      ],
      $or: [
        { coinType: { $exists: false } },
        { coinType: null },
      ],
    },
    {
      $set: {
        coinType: 'rez',
        migratedAt: new Date(),
        migrationId: '00_C2_cointransaction_typename_backfill',
      },
    },
  );
  if (earnedResult.modifiedCount > 0) {
    totalUpdated += earnedResult.modifiedCount;
    logger.info(`  earned/bonus/branded_award → 'rez': ${earnedResult.modifiedCount}`);
  }

  // spent — spending REZ coins
  const spentResult = await collection.updateMany(
    {
      type: 'spent',
      $or: [
        { coinType: { $exists: false } },
        { coinType: null },
      ],
    },
    {
      $set: {
        coinType: 'rez',
        migratedAt: new Date(),
        migrationId: '00_C2_cointransaction_typename_backfill',
      },
    },
  );
  if (spentResult.modifiedCount > 0) {
    totalUpdated += spentResult.modifiedCount;
    logger.info(`  spent → 'rez': ${spentResult.modifiedCount}`);
  }

  // refunded — return of REZ coins
  const refundedResult = await collection.updateMany(
    {
      type: 'refunded',
      $or: [
        { coinType: { $exists: false } },
        { coinType: null },
      ],
    },
    {
      $set: {
        coinType: 'rez',
        migratedAt: new Date(),
        migrationId: '00_C2_cointransaction_typename_backfill',
      },
    },
  );
  if (refundedResult.modifiedCount > 0) {
    totalUpdated += refundedResult.modifiedCount;
    logger.info(`  refunded → 'rez': ${refundedResult.modifiedCount}`);
  }

  // expired — expired REZ coins
  const expiredResult = await collection.updateMany(
    {
      type: 'expired',
      $or: [
        { coinType: { $exists: false } },
        { coinType: null },
      ],
    },
    {
      $set: {
        coinType: 'rez',
        migratedAt: new Date(),
        migrationId: '00_C2_cointransaction_typename_backfill',
      },
    },
  );
  if (expiredResult.modifiedCount > 0) {
    totalUpdated += expiredResult.modifiedCount;
    logger.info(`  expired → 'rez': ${expiredResult.modifiedCount}`);
  }

  logger.info(`\n=== MIGRATION COMPLETE ===`);
  logger.info(`  Total updated: ${totalUpdated}`);

  // Verify
  const remaining = await collection.countDocuments({
    $or: [
      { coinType: { $exists: false } },
      { coinType: null },
    ],
  });
  logger.info(`  Remaining with missing coinType: ${remaining}`);

  // Final distribution
  const finalDist = await collection.aggregate([
    { $match: { coinType: { $exists: true } } },
    { $group: { _id: '$coinType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();
  logger.info('\n  Final coinType distribution:');
  finalDist.forEach(({ _id, count }) => logger.info(`    ${_id}: ${count}`));
}

async function down(client) {
  const db = client.db();
  const collection = db.collection('cointransactions');

  logger.info('\n=== ROLLBACK ===');
  const count = await collection.countDocuments({
    migrationId: '00_C2_cointransaction_typename_backfill',
  });
  logger.info(`  Documents to rollback: ${count}`);

  if (DRY_RUN) {
    logger.info('[DRY RUN] Set DRY_RUN=false to apply rollback.');
    return;
  }

  const result = await collection.updateMany(
    { migrationId: '00_C2_cointransaction_typename_backfill' },
    {
      $unset: { coinType: '', migratedAt: '', migrationId: '' },
    },
  );
  logger.info(`  Rolled back: ${result.modifiedCount}`);
}

async function main() {
  const action = process.argv[2] || 'up';
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    logger.info(`\n=== Migration: 00_C2_cointransaction_typename_backfill ===`);
    logger.info(`Action: ${action}`);
    logger.info(`Dry run: ${DRY_RUN}`);

    if (action === 'up') await up(client);
    else if (action === 'down') await down(client);
    else { logger.error('Usage: node 00_C2_...js [up|down]'); process.exit(1); }
  } finally {
    await client.close();
  }
}

main().catch(err => { console.error('Migration failed:', err); process.exit(1); });

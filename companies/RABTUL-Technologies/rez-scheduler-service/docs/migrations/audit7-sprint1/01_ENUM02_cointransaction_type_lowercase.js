import logger from './utils/logger';

/**
 * Migration: 01_ENUM02_cointransaction_type_lowercase
 * Bug: ENUM-02 (03-ENUMS)
 * Risk: MEDIUM — case normalization affects all coin display
 *
 * Problem: coinType values stored as uppercase strings in the database
 * (e.g., 'CASHBACK', 'REFERRAL', 'REWARD') but code expects lowercase
 * ('cashback', 'referral', 'reward').
 *
 * Fix: Normalize all coinType values to lowercase.
 *
 * Canonical coinType enum: 'rez', 'prive', 'branded', 'promo', 'cashback', 'referral'
 *
 * Rollback: Restore uppercase versions for known types.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb://localhost:27017/rez-app?retryWrites=true&w=majority';

const DRY_RUN = process.env.DRY_RUN !== 'false';

const CANONICAL_TYPES = new Set([
  'rez', 'prive', 'branded', 'promo', 'cashback', 'referral',
]);

async function up(client) {
  const db = client.db();
  const collection = db.collection('cointransactions');

  logger.info('\n=== PRE-MIGRATION AUDIT ===');

  const dist = await collection.aggregate([
    { $match: { coinType: { $exists: true } } },
    { $group: { _id: '$coinType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();

  logger.info('  coinType distribution before migration:');
  dist.forEach(({ _id, count }) => {
    const flagged = (!CANONICAL_TYPES.has(_id) && _id !== _id.toLowerCase()) ? ' <-- NON-CANONICAL' :
      (_id !== _id.toLowerCase() ? ' <-- TO LOWERCASE' : '');
    logger.info(`    "${_id}": ${count}${flagged}`);
  });

  const needsFixing = dist.filter(d => d._id !== d._id.toLowerCase()).reduce((s, d) => s + d.count, 0);
  logger.info(`\n  Documents needing lowercase normalization: ${needsFixing}`);

  if (DRY_RUN) {
    logger.info('\n[DRY RUN] Set DRY_RUN=false to apply changes.');
    return;
  }

  let totalUpdated = 0;
  for (const { _id } of dist) {
    if (_id === _id.toLowerCase()) continue; // Already lowercase

    const lower = _id.toLowerCase();
    // Only apply if the lowercase version is a known canonical type
    if (!CANONICAL_TYPES.has(lower)) {
      logger.info(`  Skipping "${_id}" → lowercase "${lower}" (not a canonical type)`);
      continue;
    }

    const result = await collection.updateMany(
      { coinType: _id },
      {
        $set: {
          coinType: lower,
          migratedAt: new Date(),
          migrationId: '01_ENUM02_cointransaction_type_lowercase',
        },
      },
    );
    if (result.modifiedCount > 0) {
      totalUpdated += result.modifiedCount;
      logger.info(`  ${_id} → ${lower}: ${result.modifiedCount} updated`);
    }
  }

  logger.info(`\n=== MIGRATION COMPLETE ===`);
  logger.info(`  Total updated: ${totalUpdated}`);

  // Verify
  const newDist = await collection.aggregate([
    { $match: { coinType: { $exists: true } } },
    { $group: { _id: '$coinType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]).toArray();
  logger.info('\n  coinType distribution after migration:');
  newDist.forEach(({ _id, count }) => logger.info(`    ${_id}: ${count}`));
}

async function down(client) {
  const db = client.db();
  const collection = db.collection('cointransactions');

  logger.info('\n=== ROLLBACK ===');

  const UPPER_MAP = {
    rez: 'REZ', prive: 'PRIVE', branded: 'BRANDED',
    promo: 'PROMO', cashback: 'CASHBACK', referral: 'REFERRAL',
  };

  if (DRY_RUN) {
    const count = await collection.countDocuments({
      migrationId: '01_ENUM02_cointransaction_type_lowercase',
    });
    logger.info(`[DRY RUN] Documents to rollback: ${count}`);
    logger.info('Set DRY_RUN=false to apply rollback.');
    return;
  }

  let totalRolledBack = 0;
  for (const [lower, upper] of Object.entries(UPPER_MAP)) {
    const result = await collection.updateMany(
      { coinType: lower, migrationId: '01_ENUM02_cointransaction_type_lowercase' },
      {
        $set: { coinType: upper },
        $unset: { migratedAt: '', migrationId: '' },
      },
    );
    totalRolledBack += result.modifiedCount;
  }
  logger.info(`  Rolled back: ${totalRolledBack}`);
}

async function main() {
  const action = process.argv[2] || 'up';
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    logger.info(`\n=== Migration: 01_ENUM02_cointransaction_type_lowercase ===`);
    logger.info(`Action: ${action}`);
    logger.info(`Dry run: ${DRY_RUN}`);

    if (action === 'up') await up(client);
    else if (action === 'down') await down(client);
    else { logger.error('Usage: node 01_ENUM02_...js [up|down]'); process.exit(1); }
  } finally {
    await client.close();
  }
}

main().catch(err => { console.error('Migration failed:', err); process.exit(1); });

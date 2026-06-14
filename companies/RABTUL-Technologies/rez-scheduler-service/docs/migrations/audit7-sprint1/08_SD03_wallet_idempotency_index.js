import logger from './utils/logger';

/**
 * Migration: 08_SD03_wallet_idempotency_index
 * Bug: SD-03 (06-SCHEMA)
 * Risk: LOW — creates MongoDB index; no data change
 *
 * Problem: wallet-svc uses idempotencyKey to prevent duplicate transaction
 * writes, but there is no unique index enforcing uniqueness. Without an
 * index, concurrent writes with the same idempotencyKey can both succeed,
 * breaking idempotency guarantees.
 *
 * Fix: Create a unique sparse index on { idempotencyKey: 1, userId: 1 }
 * for the wallets collection. The index is sparse so documents without an
 * idempotencyKey are not indexed (and null values from missing fields are
 * also excluded by MongoDB's sparse behaviour).
 *
 * Index name: idempotencyKey_userId_unique
 *
 * Rollback: Drop the index.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb://localhost:27017/rez-app?retryWrites=true&w=majority';

const DRY_RUN = process.env.DRY_RUN !== 'false';
const COLLECTION = 'wallets';
const INDEX_NAME = 'idempotencyKey_userId_unique';

async function up(client) {
  const db = client.db();
  const col = db.collection(COLLECTION);

  logger.info('\n=== PRE-MIGRATION AUDIT ===');

  const totalWallets = await col.countDocuments();
  logger.info(`  Total wallets: ${totalWallets}`);

  // Count wallets that have idempotencyKey set
  const withIdempotencyKey = await col.countDocuments({
    idempotencyKey: { $exists: true, $ne: null },
  });
  const withoutIdempotencyKey = totalWallets - withIdempotencyKey;
  logger.info(`  Wallets with idempotencyKey: ${withIdempotencyKey}`);
  logger.info(`  Wallets without idempotencyKey: ${withoutIdempotencyKey}`);

  // Show sample idempotencyKey values
  const samples = await col.find(
    { idempotencyKey: { $exists: true, $ne: null } },
    { projection: { _id: 1, user: 1, idempotencyKey: 1 } },
  ).limit(3).toArray();
  if (samples.length > 0) {
    logger.info('\n  Sample wallets with idempotencyKey:');
    samples.forEach(s => {
      logger.info(`    _id=${s._id} user=${s.user} idempotencyKey="${s.idempotencyKey}"`);
    });
  }

  // Check for duplicate (idempotencyKey, userId) pairs that would conflict with the unique index
  const duplicates = await col.aggregate([
    { $match: { idempotencyKey: { $exists: true, $ne: null } } },
    { $group: { _id: { idempotencyKey: '$idempotencyKey', userId: '$user' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();

  if (duplicates.length > 0) {
    logger.info(`\n  WARNING: Found ${duplicates.length} duplicate (idempotencyKey, userId) pairs!`);
    logger.info('  The unique index will fail to create until duplicates are resolved.');
    duplicates.slice(0, 5).forEach(d => {
      logger.info(`    idempotencyKey="${d._id.idempotencyKey}" userId=${d._id.userId}: ${d.count} occurrences`);
    });
  } else {
    logger.info(`\n  No duplicate (idempotencyKey, userId) pairs found — safe to create index.`);
  }

  // List existing indexes on wallets
  const indexes = await col.indexes();
  logger.info('\n  Existing indexes:');
  indexes.forEach(idx => {
    logger.info(`    ${idx.name}: ${JSON.stringify(idx.key)} (unique=${idx.unique}, sparse=${idx.sparse})`);
  });

  const indexExists = indexes.some(idx => idx.name === INDEX_NAME);
  if (indexExists) {
    logger.info(`\n  Index '${INDEX_NAME}' already exists. Skipping creation.`);
    return;
  }

  if (DRY_RUN) {
    logger.info('\n[DRY RUN] Set DRY_RUN=false to create the index.');
    return;
  }

  // Create the unique sparse index using runCommand (MongoDB createIndex)
  const result = await db.command({
    createIndexes: COLLECTION,
    indexes: [
      {
        key: { idempotencyKey: 1, userId: 1 },
        unique: true,
        sparse: true,
        name: INDEX_NAME,
      },
    ],
  });

  logger.info(`\n=== MIGRATION COMPLETE ===`);
  logger.info(`  Index '${INDEX_NAME}' created successfully.`);
  logger.info(  Result:`, result);

  // Verify index was created
  const updatedIndexes = await col.indexes();
  const newIndex = updatedIndexes.find(idx => idx.name === INDEX_NAME);
  if (newIndex) {
    logger.info(`  Verified: ${JSON.stringify(newIndex.key)} (unique=${newIndex.unique}, sparse=${newIndex.sparse})`);
  } else {
    logger.info('  WARNING: Index not found after creation attempt!');
  }
}

async function down(client) {
  const db = client.db();
  const col = db.collection(COLLECTION);

  logger.info('\n=== ROLLBACK ===');

  // Check if index exists first
  const indexes = await col.indexes();
  const indexExists = indexes.some(idx => idx.name === INDEX_NAME);

  if (!indexExists) {
    logger.info(`  Index '${INDEX_NAME}' does not exist. Nothing to drop.`);
    return;
  }

  if (DRY_RUN) {
    logger.info(`[DRY RUN] Would drop index '${INDEX_NAME}' from collection '${COLLECTION}'.`);
    logger.info('Set DRY_RUN=false to apply rollback.');
    return;
  }

  const result = await col.dropIndex(INDEX_NAME);
  logger.info(`  Dropped index '${INDEX_NAME}': ${result}`);
}

async function main() {
  const action = process.argv[2] || 'up';
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    logger.info(`\n=== Migration: 08_SD03_wallet_idempotency_index ===`);
    logger.info(`Action: ${action}`);
    logger.info(`Dry run: ${DRY_RUN}`);

    if (action === 'up') await up(client);
    else if (action === 'down') await down(client);
    else { logger.error('Usage: node 08_SD03_...js [up|down]'); process.exit(1); }
  } finally {
    await client.close();
  }
}

main().catch(err => { console.error('Migration failed:', err); process.exit(1); });

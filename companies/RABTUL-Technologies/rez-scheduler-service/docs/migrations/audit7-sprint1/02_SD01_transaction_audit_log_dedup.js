import logger from './utils/logger';

/**
 * Migration: 02_SD01_transaction_audit_log_dedup
 * Bug: SD-01 (06-SCHEMA)
 * Risk: HIGH — migration + code change; deduplicates writes
 *
 * Problem: Two incompatible TransactionAuditLog schemas write to the
 * same collection. Deduplication needed before schema fix can deploy.
 *
 * The two schemas differ:
 *   - Schema A: { entityType, entityId, action, userId, metadata, createdAt }
 *   - Schema B: { refType, refId, operation, actorId, data, timestamp }
 *
 * Fix: Normalize all records to the canonical schema (Schema A).
 * Deduplicate: Remove duplicate entries keeping the most recent by createdAt.
 *
 * Rollback: Restore all deleted duplicates (not possible without backup).
 *   A backup collection is created before deletion.
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb://localhost:27017/rez-app?retryWrites=true&w=majority';

const COLLECTION = 'transactionAuditLogs';
const BACKUP_COLLECTION = 'transactionAuditLogs_backup_SD01';
const DRY_RUN = process.env.DRY_RUN !== 'false';

async function up(client) {
  const db = client.db();
  const col = db.collection(COLLECTION);

  logger.info('\n=== PRE-MIGRATION AUDIT ===');

  // Detect schema A vs B by checking field presence
  const schemaACount = await col.countDocuments({ entityType: { $exists: true } });
  const schemaBCount = await col.countDocuments({ refType: { $exists: true } });
  const unknownCount = await col.countDocuments({
    entityType: { $exists: false },
    refType: { $exists: false },
  });

  logger.info(`  Schema A (entityType/entityId): ${schemaACount}`);
  logger.info(`  Schema B (refType/refId): ${schemaBCount}`);
  logger.info(`  Unknown schema: ${unknownCount}`);
  logger.info(`  Total records: ${await col.countDocuments()}`);

  if (schemaBCount === 0) {
    logger.info('  No Schema B records found. Deduplication only needed.');
  }

  // Normalize Schema B → Schema A
  if (schemaBCount > 0 && !DRY_RUN) {
    const normalizeResult = await col.updateMany(
      { refType: { $exists: true } },
      [
        {
          $set: {
            entityType: '$refType',
            entityId: '$refId',
            action: '$operation',
            userId: '$actorId',
            metadata: '$data',
            createdAt: { $ifNull: ['$timestamp', '$createdAt', new Date()] },
            migratedAt: new Date(),
            migrationId: '02_SD01_transaction_audit_log_dedup',
          },
        },
        {
          $unset: ['refType', 'refId', 'operation', 'actorId', 'data', 'timestamp'],
        },
      ],
    );
    logger.info(`  Normalized Schema B → A: ${normalizeResult.modifiedCount}`);
  }

  // Deduplication
  logger.info('\n=== DEDUPLICATION ===');

  // Build deduplication key: entityType + entityId + action + userId
  // Group by key, keep record with latest createdAt
  const duplicates = await col.aggregate([
    {
      $group: {
        _id: {
          entityType: '$entityType',
          entityId: '$entityId',
          action: '$action',
          userId: '$userId',
        },
        count: { $sum: 1 },
        docs: { $push: { _id: '$_id', createdAt: '$createdAt' } },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();

  const totalDupeGroups = duplicates.length;
  let totalDuplicates = duplicates.reduce((sum, g) => sum + g.count - 1, 0);

  logger.info(`  Duplicate groups: ${totalDupeGroups}`);
  logger.info(`  Total duplicate records: ${totalDuplicates}`);

  if (DRY_RUN) {
    logger.info('\n[DRY RUN] Sample duplicate groups:');
    duplicates.slice(0, 3).forEach(group => {
      logger.info(`  ${group._id.entityType}/${group._id.entityId}/${group._id.action}: ${group.count} records`);
    });
    logger.info('\n  Set DRY_RUN=false to apply deduplication.');
    return;
  }

  // Create backup before deleting
  logger.info('\n  Creating backup collection...');
  await col.aggregate([{ $out: BACKUP_COLLECTION }]);
  logger.info(`  Backup saved to: ${BACKUP_COLLECTION}`);

  // Delete duplicates: for each group, delete all but the record with latest createdAt
  let totalDeleted = 0;
  for (const group of duplicates) {
    const sorted = group.docs.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    const keepId = sorted[0]._id;
    const deleteIds = sorted.slice(1).map(d => d._id);

    const result = await col.deleteMany({ _id: { $in: deleteIds } });
    totalDeleted += result.deletedCount;
  }

  logger.info(`\n=== MIGRATION COMPLETE ===`);
  logger.info(`  Total duplicates removed: ${totalDeleted}`);
  logger.info(`  Backup collection: ${BACKUP_COLLECTION}`);
  logger.info(`  Remaining records: ${await col.countDocuments()}`);

  // Verify no duplicates remain
  const remainingDupes = await col.aggregate([
    {
      $group: {
        _id: { entityType: '$entityType', entityId: '$entityId', action: '$action', userId: '$userId' },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();
  logger.info(`  Remaining duplicate groups: ${remainingDupes.length}`);
}

async function down(client) {
  const db = client.db();
  const col = db.collection(COLLECTION);
  const backup = db.collection(BACKUP_COLLECTION);

  logger.info('\n=== ROLLBACK ===');

  if (DRY_RUN) {
    const backupCount = await backup.countDocuments();
    logger.info(`[DRY RUN] Backup collection has ${backupCount} records.`);
    logger.info('Set DRY_RUN=false to restore from backup.');
    return;
  }

  // Restore from backup
  await col.deleteMany({});
  const restored = await backup.aggregate([{ $out: COLLECTION }]).toArray();
  const count = await col.countDocuments();
  logger.info(`  Restored ${count} records from backup.`);
}

async function main() {
  const action = process.argv[2] || 'up';
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    logger.info(`\n=== Migration: 02_SD01_transaction_audit_log_dedup ===`);
    logger.info(`Action: ${action}`);
    logger.info(`Dry run: ${DRY_RUN}`);

    if (action === 'up') await up(client);
    else if (action === 'down') await down(client);
    else { logger.error('Usage: node 02_SD01_...js [up|down]'); process.exit(1); }
  } finally {
    await client.close();
  }
}

main().catch(err => { console.error('Migration failed:', err); process.exit(1); });

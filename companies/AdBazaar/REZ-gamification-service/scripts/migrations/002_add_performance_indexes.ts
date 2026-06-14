import logger from 'utils/logger.js';

/**
 * Migration: 002_add_performance_indexes
 *
 * Adds performance-critical indexes to support:
 * 1. getPriorVisitedStoreIds() in rez-search-service - userId index on storevisits
 * 2. Trending store queries in rez-search-service - type + updatedAt index on userstreaks
 *
 * Run: npx ts-node scripts/migrations/002_add_performance_indexes.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-gamification';

interface IndexSpec {
  collection: string;
  spec: Record<string, 1>;
  name: string;
}

const indexes: IndexSpec[] = [
  // PERF-FIX: userId alone for getPriorVisitedStoreIds() in rez-search-service
  // Supports personalisation ranking queries that only filter by userId
  {
    collection: 'storevisits',
    spec: { userId: 1 },
    name: 'storevisits_userId',
  },
  // PERF-FIX: type + updatedAt for trending store queries
  // Used by rez-search-service getTrendingStores() and getTrendingByCategory()
  // Matches: { type: 'store_visit', updatedAt: { $gte: sevenDaysAgo } }
  {
    collection: 'userstreaks',
    spec: { type: 1, updatedAt: 1 },
    name: 'userstreaks_type_updatedAt',
  },
];

async function runMigration(): Promise<void> {
  logger.info('Starting migration: 002_add_performance_indexes');
  logger.info('='.repeat(50));

  if (!MONGODB_URI) {
    logger.error('ERROR: MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    let createdCount = 0;
    let skippedCount = 0;

    for (const index of indexes) {
      const collection = mongoose.connection.collection(index.collection);

      logger.info(`\nProcessing index: ${index.name}`);
      logger.info(`  Collection: ${index.collection}`);
      logger.info(`  Spec: ${JSON.stringify(index.spec)}`);

      try {
        // Check if index already exists
        const existingIndexes = await collection.indexes();
        const indexExists = existingIndexes.some(
          (idx) => idx.name === index.name ||
                   (idx.key && JSON.stringify(idx.key) === JSON.stringify(index.spec))
        );

        if (indexExists) {
          logger.info(`  SKIPPED: Index already exists`);
          skippedCount++;
          continue;
        }

        // Create index with background: true to avoid blocking
        await collection.createIndex(index.spec, {
          background: true,
          name: index.name,
        });

        logger.info(`  CREATED: Index created successfully`);
        createdCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);

        // Ignore duplicate key errors (index already exists with different name)
        if (msg.includes('already exists') || msg.includes('duplicate')) {
          logger.info(`  SKIPPED: ${msg}`);
          skippedCount++;
        } else {
          logger.error(`  ERROR: ${msg}`);
          throw err;
        }
      }
    }

    logger.info('\n' + '='.repeat(50));
    logger.info('Migration Summary:');
    logger.info(`  Created: ${createdCount}`);
    logger.info(`  Skipped: ${skippedCount}`);
    logger.info(`  Total: ${indexes.length}`);

    if (createdCount > 0) {
      logger.info('\nNote: Background index builds may take some time to complete.');
      logger.info('Check progress with: db.getCollection("<name>").getIndexes()');
    }

  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('\nDisconnected from MongoDB');
  }
}

// Run migration
runMigration();

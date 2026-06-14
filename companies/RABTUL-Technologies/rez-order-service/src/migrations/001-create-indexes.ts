import logger from './utils/logger';

/**
 * Database Index Migration Script
 *
 * Creates performance indexes for optimal query performance.
 * Run once during deployment or manually.
 *
 * Usage:
 *   npx ts-node src/migrations/001-create-indexes.ts
 *
 * IMPORTANT: These indexes should be created in MongoDB directly,
 * not via autoIndex which causes issues in production.
 */

import mongoose from 'mongoose';

// Simple logger for migrations
const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    logger.info(`[INDEX] ${message}${metaStr}`);
  },
  success: (message: string) => {
    logger.info(`\x1b[32m[INDEX] ${message}\x1b[0m`);
  },
  warn: (message: string) => {
    logger.info(`\x1b[33m[INDEX] ${message}\x1b[0m`);
  },
  error: (message: string, err?: Error) => {
    console.error(`\x1b[31m[INDEX] ${message}\x1b[0m`, err || '');
  },
};

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-order';

interface IndexDefinition {
  collection: string;
  index: Record<string, 1 | -1>;
  name: string;
  options?: Record<string, unknown>;
}

// Performance indexes for order service
const INDEXES: IndexDefinition[] = [
  // Orders collection
  {
    collection: 'orders',
    index: { user: 1, createdAt: -1 },
    name: 'idx_orders_user_createdAt',
  },
  {
    collection: 'orders',
    index: { merchant: 1, createdAt: -1 },
    name: 'idx_orders_merchant_createdAt',
  },
  {
    collection: 'orders',
    index: { merchant: 1, status: 1 },
    name: 'idx_orders_merchant_status',
  },
  {
    collection: 'orders',
    index: { user: 1, status: 1 },
    name: 'idx_orders_user_status',
  },
  {
    collection: 'orders',
    index: { clientIdempotencyKey: 1 },
    name: 'idx_orders_idempotency',
    options: { unique: true },
  },
  {
    collection: 'orders',
    index: { createdAt: -1 },
    name: 'idx_orders_createdAt',
  },
];

async function createIndexes(): Promise<void> {
  logger.info('Starting database index creation...');

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`Connected to MongoDB`, { uri: MONGODB_URI });

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    for (const idx of INDEXES) {
      const collection = db.collection(idx.collection);
      try {
        await collection.createIndex(idx.index, {
          name: idx.name,
          background: true,
          ...idx.options,
        });
        logger.success(`Created index: ${idx.name} on ${idx.collection}`);
      } catch (err) {
        if (err.code === 85 || err.code === 86) {
          // Index already exists with different options
          logger.warn(`Index ${idx.name} already exists with different options`);
        } else if (err.code === 68) {
          // Index already exists
          logger.success(`Index ${idx.name} already exists`);
        } else {
          throw err;
        }
      }
    }

    logger.success('Index creation complete!');
    logger.info('Verifying indexes...');

    for (const idx of INDEXES) {
      const collection = db.collection(idx.collection);
      const indexes = await collection.indexes();
      const found = indexes.find(i => i.name === idx.name);
      if (found) {
        logger.success(`Verified: ${idx.name}`);
      } else {
        logger.warn(`Missing: ${idx.name}`);
      }
    }
  } catch (err) {
    logger.error('Error creating indexes:', err as Error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

createIndexes();

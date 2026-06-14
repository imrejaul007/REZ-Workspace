import logger from './utils/logger';

/**
 * Database Index Migration Script
 *
 * Run this script to add performance indexes to MongoDB collections.
 * Safe to run multiple times - MongoDB will not recreate existing indexes.
 *
 * Usage:
 *   npx ts-node scripts/add-indexes.ts
 *
 * Check existing indexes:
 *   db.collection.getIndexes()
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-merchant';

interface IndexDefinition {
  collection: string;
  indexes: { key: Record<string, 1 | -1>; name: string; unique?: boolean; sparse?: boolean }[];
}

const indexes: IndexDefinition[] = [
  {
    collection: 'customers',
    indexes: [
      { key: { merchantId: 1, createdAt: -1 }, name: 'idx_merchant_date' },
      { key: { merchantId: 1, phone: 1 }, name: 'idx_merchant_phone', sparse: true },
      { key: { merchantId: 1, 'wallet.balance': 1 }, name: 'idx_wallet_balance' },
      { key: { 'loyalty.tier': 1 }, name: 'idx_loyalty_tier' },
    ],
  },
  {
    collection: 'orders',
    indexes: [
      { key: { merchantId: 1, status: 1, createdAt: -1 }, name: 'idx_merchant_status_date' },
      { key: { merchantId: 1, 'customer.phone': 1 }, name: 'idx_merchant_customer_phone' },
      { key: { status: 1, createdAt: -1 }, name: 'idx_status_date' },
    ],
  },
  {
    collection: 'suppliers',
    indexes: [
      { key: { merchantId: 1, createdAt: -1 }, name: 'idx_merchant_date' },
      { key: { merchantId: 1, creditLimit: -1 }, name: 'idx_credit_limit' },
    ],
  },
  {
    collection: 'purchases',
    indexes: [
      { key: { merchantId: 1, date: -1 }, name: 'idx_merchant_date' },
      { key: { merchantId: 1, supplierId: 1, date: -1 }, name: 'idx_merchant_supplier_date' },
    ],
  },
  {
    collection: 'wallet_transactions',
    indexes: [
      { key: { merchantId: 1, createdAt: -1 }, name: 'idx_merchant_date' },
      { key: { merchantId: 1, type: 1, createdAt: -1 }, name: 'idx_merchant_type_date' },
    ],
  },
  {
    collection: 'merchant_users',
    indexes: [
      { key: { merchantId: 1, email: 1 }, name: 'idx_merchant_email', unique: true, sparse: true },
      { key: { merchantId: 1, phone: 1 }, name: 'idx_merchant_phone', sparse: true },
    ],
  },
  {
    collection: 'khata',
    indexes: [
      { key: { merchantId: 1, customerId: 1 }, name: 'idx_merchant_customer' },
      { key: { merchantId: 1, dueDate: 1, status: 1 }, name: 'idx_overdue' },
    ],
  },
];

async function ensureIndexes(): Promise<void> {
  logger.info('🔄 Starting database index migration...\n');

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;

  let totalIndexes = 0;
  let newIndexes = 0;

  for (const { collection, indexes: collectionIndexes } of indexes) {
    logger.info(`📦 Processing collection: ${collection}`);

    try {
      const coll = db.collection(collection);
      const existingIndexes = await coll.indexes();

      for (const idx of collectionIndexes) {
        totalIndexes++;
        const exists = existingIndexes.some(
          (existing) => existing.name === idx.name
        );

        if (exists) {
          logger.info(`   ⏭️  ${idx.name} - already exists`);
        } else {
          await coll.createIndex(idx.key, {
            name: idx.name,
            unique: idx.unique,
            sparse: idx.sparse,
          });
          newIndexes++;
          logger.info(`   ✅ ${idx.name} - created`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${collection}:`, error);
    }

    logger.info('');
  }

  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info(`✅ Migration complete!`);
  logger.info(`   Total indexes checked: ${totalIndexes}`);
  logger.info(`   New indexes created: ${newIndexes}`);
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
}

// Run if called directly
if (require.main === module) {
  ensureIndexes().catch(console.error);
}

export { ensureIndexes };

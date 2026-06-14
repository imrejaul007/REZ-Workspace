import logger from './utils/logger';

/**
 * Database Index Migration Script
 *
 * Adds critical missing indexes for performance optimization.
 * Run this script during deployment or maintenance window.
 *
 * Usage:
 *   npx ts-node scripts/add-missing-indexes.ts
 *
 * IMPORTANT: This creates indexes in the background (background: true)
 * to avoid blocking production traffic.
 */

import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-platform';

interface IndexDefinition {
  collection: string;
  indexes: Array<{
    fields: Record<string, 1 | -1>;
    options?: Record<string, unknown>;
    name?: string;
  }>;
}

// Critical indexes for all services
const INDEXES: IndexDefinition[] = [
  // ============================================
  // USER PROFILES
  // ============================================
  {
    collection: 'userprofiles',
    indexes: [
      { fields: { userId: 1 }, options: { unique: true, name: 'idx_userId_unique' } },
      { fields: { email: 1 }, options: { sparse: true, name: 'idx_email_sparse' } },
      { fields: { phone: 1 }, options: { sparse: true, name: 'idx_phone_sparse' } },
      { fields: { 'loyalty.tier': 1 }, options: { name: 'idx_loyalty_tier' } },
      { fields: { createdAt: -1, status: 1 }, options: { name: 'idx_created_status' } },
      { fields: { userId: 1, createdAt: -1 }, options: { name: 'idx_userId_created' } },
    ],
  },

  // ============================================
  // ORDERS
  // ============================================
  {
    collection: 'orders',
    indexes: [
      { fields: { userId: 1, createdAt: -1 }, options: { name: 'idx_userId_created' } },
      { fields: { merchantId: 1, status: 1 }, options: { name: 'idx_merchant_status' } },
      { fields: { 'items.productId': 1 }, options: { name: 'idx_productId' } },
      { fields: { razorpayOrderId: 1 }, options: { unique: true, sparse: true, name: 'idx_razorpayOrderId' } },
      { fields: { status: 1, createdAt: -1 }, options: { name: 'idx_status_created' } },
      { fields: { driverId: 1, status: 1 }, options: { name: 'idx_driver_status' } },
    ],
  },

  // ============================================
  // PAYMENTS
  // ============================================
  {
    collection: 'payments',
    indexes: [
      { fields: { userId: 1, status: 1, createdAt: -1 }, options: { name: 'idx_user_status_created' } },
      { fields: { razorpayPaymentId: 1 }, options: { unique: true, sparse: true, name: 'idx_razorpayPaymentId' } },
      { fields: { orderId: 1 }, options: { name: 'idx_orderId' } },
      { fields: { status: 1, createdAt: -1 }, options: { name: 'idx_status_created' } },
      { fields: { type: 1, createdAt: -1 }, options: { name: 'idx_type_created' } },
    ],
  },

  // ============================================
  // WALLET TRANSACTIONS
  // ============================================
  {
    collection: 'wallettransactions',
    indexes: [
      { fields: { userId: 1, createdAt: -1 }, options: { name: 'idx_userId_created' } },
      { fields: { type: 1, createdAt: -1 }, options: { name: 'idx_type_created' } },
      { fields: { referenceId: 1, type: 1 }, options: { name: 'idx_referenceId_type' } },
      { fields: { status: 1, createdAt: -1 }, options: { name: 'idx_status_created' } },
    ],
  },

  // ============================================
  // DRIVERS / RIDERS (Ride Service)
  // ============================================
  {
    collection: 'drivers',
    indexes: [
      { fields: { driverId: 1 }, options: { unique: true, name: 'idx_driverId_unique' } },
      { fields: { phone: 1 }, options: { unique: true, sparse: true, name: 'idx_phone_unique' } },
      { fields: { status: 1, location: '2dsphere' }, options: { name: 'idx_status_location' } },
      { fields: { 'vehicle.type': 1, status: 1 }, options: { name: 'idx_vehicle_status' } },
    ],
  },

  // ============================================
  // RIDES
  // ============================================
  {
    collection: 'rides',
    indexes: [
      { fields: { userId: 1, createdAt: -1 }, options: { name: 'idx_userId_created' } },
      { fields: { driverId: 1, status: 1 }, options: { name: 'idx_driver_status' } },
      { fields: { status: 1, pickupLocation: '2dsphere' }, options: { name: 'idx_status_pickup' } },
      { fields: { rideId: 1 }, options: { unique: true, name: 'idx_rideId_unique' } },
    ],
  },

  // ============================================
  // CAMPAIGNS
  // ============================================
  {
    collection: 'campaigns',
    indexes: [
      { fields: { status: 1, startDate: 1, endDate: 1 }, options: { name: 'idx_status_dates' } },
      { fields: { userId: 1, status: 1 }, options: { name: 'idx_user_status' } },
      { fields: { type: 1, status: 1 }, options: { name: 'idx_type_status' } },
    ],
  },

  // ============================================
  // VOUCHERS
  // ============================================
  {
    collection: 'vouchers',
    indexes: [
      { fields: { code: 1 }, options: { unique: true, name: 'idx_code_unique' } },
      { fields: { userId: 1, status: 1 }, options: { name: 'idx_user_status' } },
      { fields: { expiresAt: 1, status: 1 }, options: { name: 'idx_expires_status' } },
    ],
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================
  {
    collection: 'notifications',
    indexes: [
      { fields: { userId: 1, createdAt: -1 }, options: { name: 'idx_userId_created' } },
      { fields: { userId: 1, isRead: 1, createdAt: -1 }, options: { name: 'idx_userId_read_created' } },
      { fields: { type: 1, status: 1 }, options: { name: 'idx_type_status' } },
    ],
  },

  // ============================================
  // INTENTS (AI)
  // ============================================
  {
    collection: 'intents',
    indexes: [
      { fields: { userId: 1, intentKey: 1 }, options: { unique: true, name: 'idx_userId_intentKey' } },
      { fields: { userId: 1, status: 1, confidence: -1 }, options: { name: 'idx_userId_status_conf' } },
      { fields: { embedding: '2dsphere' }, options: { name: 'idx_embedding', sparse: true } },
      { fields: { category: 1, confidence: -1 }, options: { name: 'idx_category_conf' } },
    ],
  },

  // ============================================
  // PREDICTIONS
  // ============================================
  {
    collection: 'predictions',
    indexes: [
      { fields: { userId: 1, type: 1, createdAt: -1 }, options: { name: 'idx_userType_created' } },
      { fields: { type: 1, score: -1 }, options: { name: 'idx_type_score' } },
    ],
  },
];

async function addIndexes() {
  logger.info('🔍 Starting index migration...\n');

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`✅ Connected to MongoDB: ${MONGODB_URI}\n`);

    const db = mongoose.connection.db;
    let totalIndexesCreated = 0;
    let totalIndexesSkipped = 0;

    for (const collectionDef of INDEXES) {
      const collection = db.collection(collectionDef.collection);

      logger.info(`\n📦 Collection: ${collectionDef.collection}`);
      console.log('─'.repeat(50));

      for (const index of collectionDef.indexes) {
        const indexName = index.name || Object.keys(index.fields).join('_');

        try {
          // Check if index already exists
          const existingIndexes = await collection.indexes();
          const exists = existingIndexes.some(
            (idx) => idx.name === indexName
          );

          if (exists) {
            logger.info(`  ⏭️  Skipped (exists): ${indexName}`);
            totalIndexesSkipped++;
            continue;
          }

          // Create index
          await collection.createIndex(index.fields, {
            ...index.options,
            background: true, // Non-blocking
          });

          logger.info(`  ✅ Created: ${indexName}`);
          logger.info(`     Fields: ${JSON.stringify(index.fields)}`);
          totalIndexesCreated++;
        } catch (error) {
          if (error.code === 85 || error.code === 86) {
            // Index already exists with different options
            logger.info(`  ⚠️  Exists with different options: ${indexName}`);
            totalIndexesSkipped++;
          } else {
            logger.info(`  ❌ Error: ${indexName} - ${error.message}`);
          }
        }
      }
    }

    logger.info('\n' + '═'.repeat(50));
    logger.info('📊 INDEX MIGRATION SUMMARY');
    console.log('═'.repeat(50));
    logger.info(`   Created: ${totalIndexesCreated}`);
    logger.info(`   Skipped: ${totalIndexesSkipped}`);
    logger.info(`   Total:   ${totalIndexesCreated + totalIndexesSkipped}`);
    console.log('═'.repeat(50));

    // Analyze collections for query optimization
    logger.info('\n🔬 Running collection stats...\n');

    for (const collectionDef of INDEXES) {
      try {
        const result = await db.collection(collectionDef.collection).stats();
        logger.info(`   ${collectionDef.collection}: ${result.count || 0} documents`);
      } catch {
        // Collection might not exist
      }
    }

    logger.info('\n✅ Index migration complete!');
    logger.info('\n⚠️  NOTE: Index creation continues in background.');
    logger.info('    Large indexes may take time to build.');
    logger.info('    Use db.collection.getIndexes() to monitor progress.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run migration
addIndexes();

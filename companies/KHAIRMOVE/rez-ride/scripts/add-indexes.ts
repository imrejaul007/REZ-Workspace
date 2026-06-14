import { logger } from '../../shared/logger';
/**
 * ReZ Ride - Database Index Creation Script
 * Run: npx ts-node scripts/add-indexes.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-ride';

interface IndexDefinition {
  collection: string;
  indexes: mongoose.IndexDefinition[];
  options?: mongoose.IndexOptions;
}

const INDEXES: IndexDefinition[] = [
  // Rides collection
  {
    collection: 'rides',
    indexes: [
      { userId: 1, status: 1, createdAt: -1 },
      { driverId: 1, status: 1 },
      { status: 1, createdAt: -1 },
      { cityId: 1, status: 1 },
      { 'pickup.location': '2dsphere' },
      { 'dropoff.location': '2dsphere' },
    ],
    options: { background: true }
  },
  // Drivers collection
  {
    collection: 'drivers',
    indexes: [
      { phone: 1 },
      { status: 1, cityId: 1 },
      { 'currentLocation.location': '2dsphere' },
      { rating: -1 },
    ],
    options: { background: true }
  },
  // Users collection
  {
    collection: 'users',
    indexes: [
      { phone: 1 },
      { email: 1 },
    ],
    options: { background: true, unique: true }
  },
  // Rental bookings collection
  {
    collection: 'rentalbookings',
    indexes: [
      { userId: 1, status: 1 },
      { driverId: 1, status: 1 },
      { bookingId: 1 },
      { status: 1, createdAt: -1 },
    ],
    options: { background: true }
  },
  // Vouchers collection
  {
    collection: 'vouchers',
    indexes: [
      { code: 1 },
      { userId: 1, status: 1 },
      { expiresAt: 1, status: 1 },
    ],
    options: { background: true }
  },
  // Ads collection
  {
    collection: 'ads',
    indexes: [
      { campaignId: 1, status: 1 },
      { status: 1, startDate: 1, endDate: 1 },
      { 'targeting.location': '2dsphere' },
    ],
    options: { background: true }
  },
  // Driver locations (real-time)
  {
    collection: 'driverlocations',
    indexes: [
      { location: '2dsphere' },
      { driverId: 1 },
      { updatedAt: 1 },
    ],
    options: { background: true, expireAfterSeconds: 300 } // 5 min TTL
  },
];

async function createIndexes(): Promise<void> {
  logger.info('🔧 Creating database indexes...\n');

  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`✅ Connected to MongoDB: ${MONGODB_URI}\n`);

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    for (const indexDef of INDEXES) {
      try {
        const collection = db.collection(indexDef.collection);
        logger.info(`📊 Creating indexes on '${indexDef.collection}'...`);

        for (const index of indexDef.indexes) {
          await collection.createIndex(index, indexDef.options);
          logger.info(`   ✅ ${JSON.stringify(index)}`);
        }
        logger.info('');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`   ❌ Failed on '${indexDef.collection}': ${message}`);
      }
    }

    logger.info('✨ Index creation complete!');
    logger.info('\n📋 Recommended additional indexes (run manually if needed):');
    logger.info('   db.rides.createIndex({ "requestedAt": 1 }, { expireAfterSeconds: 86400 }) // 24h TTL for old requests');

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ Failed to create indexes: ${message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

createIndexes();

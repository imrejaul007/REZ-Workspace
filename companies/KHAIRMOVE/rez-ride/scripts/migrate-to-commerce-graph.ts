import { logger } from '../../shared/logger';
/**
 * Commerce Graph Historical Data Migration Script
 *
 * Migrates all completed rides from ReZ Ride to Commerce Graph
 * Usage: npx ts-node scripts/migrate-to-commerce-graph.ts
 */

import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-ride';
const COMMERCE_GRAPH_URL = process.env.COMMERCE_GRAPH_URL || 'http://localhost:4170';
const BATCH_SIZE = 100;

// Ride schema (matching the existing model)
const rideSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  pickup: {
    lat: Number,
    lng: Number,
    address: String
  },
  drop: {
    lat: Number,
    lng: Number,
    address: String
  },
  vehicleType: String,
  status: String,
  fare: {
    total: Number,
    base: Number,
    distance: Number,
    time: Number
  },
  distanceKm: Number,
  durationMinutes: Number,
  cashbackAmount: Number,
  completedAt: Date,
  createdAt: Date
});

const Ride = mongoose.model('Ride', rideSchema);

interface MigrationResult {
  total: number;
  synced: number;
  failed: number;
  errors: string[];
}

async function migrateRide(ride: any, client: typeof axios): Promise<boolean> {
  try {
    // Record transaction
    await client.post(`${COMMERCE_GRAPH_URL}/api/transactions`, {
      customerId: ride.userId.toString(),
      merchantId: ride.driverId?.toString() || 'unknown',
      transactionId: `ride_${ride._id.toString()}`,
      type: 'purchase',
      amount: ride.fare?.total || 0,
      category: 'ride_hailing',
      items: [ride.vehicleType || 'cab'],
      paymentMethod: 'wallet',
      coinsEarned: Math.floor((ride.fare?.total || 0) * 0.05),
      cashbackEarned: ride.cashbackAmount || 0,
      timestamp: ride.completedAt || ride.createdAt,
      metadata: {
        pickup: ride.pickup,
        drop: ride.drop,
        distance: ride.distanceKm,
        duration: ride.durationMinutes,
        vehicleType: ride.vehicleType
      }
    });

    // Record event
    await client.post(`${COMMERCE_GRAPH_URL}/api/events`, {
      customerId: ride.userId.toString(),
      merchantId: ride.driverId?.toString() || 'unknown',
      eventType: 'ride_completed',
      transactionId: `ride_${ride._id.toString()}`,
      category: 'ride_hailing',
      location: ride.drop,
      timestamp: ride.completedAt || ride.createdAt
    });

    return true;
  } catch (error) {
    return false;
  }
}

async function migrateAllRides(): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: 0,
    synced: 0,
    failed: 0,
    errors: []
  };

  const client = axios.create({
    timeout: 10000,
    headers: {
      'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || ''
    }
  });

  logger.info('\n========================================');
  logger.info('Commerce Graph Historical Data Migration');
  logger.info('========================================\n');
  logger.info(`Source: ${MONGODB_URI}`);
  logger.info(`Target: ${COMMERCE_GRAPH_URL}`);
  logger.info(`Batch Size: ${BATCH_SIZE}\n`);

  try {
    // Count total completed rides
    const totalCount = await Ride.countDocuments({
      status: 'completed',
      completedAt: { $exists: true }
    });
    result.total = totalCount;
    logger.info(`Found ${totalCount} completed rides to migrate\n`);

    if (totalCount === 0) {
      logger.info('No rides to migrate. Exiting.');
      return result;
    }

    // Process in batches
    let processed = 0;
    let skip = 0;

    while (skip < totalCount) {
      const rides = await Ride.find({
        status: 'completed',
        completedAt: { $exists: true }
      })
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean();

      if (rides.length === 0) break;

      const batchPromises = rides.map(async (ride) => {
        const success = await migrateRide(ride, client);
        if (success) {
          result.synced++;
        } else {
          result.failed++;
          result.errors.push(`Failed to migrate ride ${ride._id}`);
        }
        processed++;
      });

      await Promise.all(batchPromises);

      // Progress update
      const percent = Math.round((processed / totalCount) * 100);
      logger.info(`Progress: ${processed}/${totalCount} (${percent}%) - Synced: ${result.synced}, Failed: ${result.failed}`);

      skip += BATCH_SIZE;
    }

    logger.info('\n========================================');
    logger.info('Migration Complete');
    logger.info('========================================');
    logger.info(`Total: ${result.total}`);
    logger.info(`Synced: ${result.synced}`);
    logger.info(`Failed: ${result.failed}`);
    if (result.errors.length > 0) {
      logger.info(`\nFirst 10 errors:`);
      result.errors.slice(0, 10).forEach(e => logger.info(`  - ${e}`));
    }
    logger.info('========================================\n');

  } catch (error) {
    logger.error(`Migration error: ${error.message}`);
    result.errors.push(error.message);
  }

  return result;
}

async function main() {
  logger.info('Connecting to MongoDB...');

  await mongoose.connect(MONGODB_URI);
  logger.info('Connected.\n');

  const result = await migrateAllRides();

  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB.');

  // Exit with appropriate code
  process.exit(result.failed > 0 ? 1 : 0);
}

main().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

import { logger } from '../../shared/logger';
/**
 * Migration: Add Critical Indexes
 * Run with: npx ts-node src/migrations/001_add_critical_indexes.ts
 *
 * This migration adds indexes that were found to be missing during the database audit.
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_ride';

async function migrate() {
  logger.info('Starting migration: 001_add_critical_indexes');
  logger.info(`Connecting to: ${MONGODB_URI}`);

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('Failed to connect to database');
  }

  try {
    // ========================================
    // RIDE COLLECTION INDEXES
    // ========================================
    logger.info('\n--- Ride Collection ---');

    // Missing: userId + status + createdAt compound
    await db.collection('rides').createIndex(
      { userId: 1, status: 1, createdAt: -1 },
      { name: 'idx_ride_user_status_date' }
    );
    logger.info('✓ Created: idx_ride_user_status_date');

    // Missing: driverId + status compound
    await db.collection('rides').createIndex(
      { driverId: 1, status: 1 },
      { name: 'idx_ride_driver_status' }
    );
    logger.info('✓ Created: idx_ride_driver_status');

    // Missing: status + createdAt for admin queries
    await db.collection('rides').createIndex(
      { status: 1, createdAt: -1 },
      { name: 'idx_ride_status_date' }
    );
    logger.info('✓ Created: idx_ride_status_date');

    // Missing: paymentId for payment lookups
    await db.collection('rides').createIndex(
      { paymentId: 1 },
      { name: 'idx_ride_payment_id', sparse: true }
    );
    logger.info('✓ Created: idx_ride_payment_id');

    // Geo indexes for pickup/drop
    await db.collection('rides').createIndex(
      { pickup: '2dsphere' },
      { name: 'idx_ride_pickup_geo' }
    );
    logger.info('✓ Created: idx_ride_pickup_geo');

    await db.collection('rides').createIndex(
      { drop: '2dsphere' },
      { name: 'idx_ride_drop_geo' }
    );
    logger.info('✓ Created: idx_ride_drop_geo');

    // ========================================
    // DRIVER COLLECTION INDEXES
    // ========================================
    logger.info('\n--- Driver Collection ---');

    // Missing: 2dsphere for nearby driver queries
    await db.collection('drivers').createIndex(
      { currentLocation: '2dsphere' },
      { name: 'idx_driver_location_geo' }
    );
    logger.info('✓ Created: idx_driver_location_geo');

    // Missing: status + availability for driver matching
    await db.collection('drivers').createIndex(
      { status: 1, isAvailable: 1 },
      { name: 'idx_driver_status_availability' }
    );
    logger.info('✓ Created: idx_driver_status_availability');

    // ========================================
    // WALLET COLLECTION INDEXES (NEW)
    // ========================================
    logger.info('\n--- RideWallet Collection ---');

    await db.collection('ridewallets').createIndex(
      { balance: 1 },
      { name: 'idx_wallet_balance' }
    );
    logger.info('✓ Created: idx_wallet_balance');

    await db.collection('ridewallets').createIndex(
      { isActive: 1, balance: 1 },
      { name: 'idx_wallet_active_balance' }
    );
    logger.info('✓ Created: idx_wallet_active_balance');

    await db.collection('ridewallets').createIndex(
      { lastTransactionAt: -1 },
      { name: 'idx_wallet_last_transaction' }
    );
    logger.info('✓ Created: idx_wallet_last_transaction');

    // ========================================
    // WALLET TRANSACTION COLLECTION INDEXES (NEW)
    // ========================================
    logger.info('\n--- WalletTransaction Collection ---');

    await db.collection('wallettransactions').createIndex(
      { userId: 1, type: 1, createdAt: -1 },
      { name: 'idx_wtx_user_type_date' }
    );
    logger.info('✓ Created: idx_wtx_user_type_date');

    await db.collection('wallettransactions').createIndex(
      { userId: 1, status: 1, createdAt: -1 },
      { name: 'idx_wtx_user_status_date' }
    );
    logger.info('✓ Created: idx_wtx_user_status_date');

    await db.collection('wallettransactions').createIndex(
      { referenceId: 1, source: 1 },
      { name: 'idx_wtx_reference_source' }
    );
    logger.info('✓ Created: idx_wtx_reference_source');

    await db.collection('wallettransactions').createIndex(
      { idempotencyKey: 1 },
      { name: 'idx_wtx_idempotency', unique: true, sparse: true }
    );
    logger.info('✓ Created: idx_wtx_idempotency');

    await db.collection('wallettransactions').createIndex(
      { completedAt: -1 },
      { name: 'idx_wtx_completed_at' }
    );
    logger.info('✓ Created: idx_wtx_completed_at');

    await db.collection('wallettransactions').createIndex(
      { status: 1 },
      { name: 'idx_wtx_status' }
    );
    logger.info('✓ Created: idx_wtx_status');

    // ========================================
    // AUDIT LOG COLLECTION
    // ========================================
    logger.info('\n--- Audit Log Collection ---');

    await db.collection('auditlogs').createIndex(
      { userId: 1, timestamp: -1 },
      { name: 'idx_audit_user_timestamp' }
    );
    logger.info('✓ Created: idx_audit_user_timestamp');

    await db.collection('auditlogs').createIndex(
      { tenantId: 1, timestamp: -1 },
      { name: 'idx_audit_tenant_timestamp' }
    );
    logger.info('✓ Created: idx_audit_tenant_timestamp');

    await db.collection('auditlogs').createIndex(
      { eventType: 1, timestamp: -1 },
      { name: 'idx_audit_eventtype_timestamp' }
    );
    logger.info('✓ Created: idx_audit_eventtype_timestamp');

    logger.info('\n========================================');
    logger.info('Migration completed successfully!');
    logger.info('========================================\n');

  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run migration
migrate()
  .then(() => {
    logger.info('Done');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration error:', error);
    process.exit(1);
  });

import logger from './utils/logger';

/**
 * Migration: Add Missing Indexes to RABTUL Profile Service
 * Run with: npx ts-node src/migrations/001_add_missing_indexes.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_profile';

async function migrate() {
  logger.info('Starting migration: 001_add_missing_indexes');
  logger.info(`Connecting to: ${MONGODB_URI}`);

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('Failed to connect to database');
  }

  try {
    // ========================================
    // PROFILE COLLECTION INDEXES
    // ========================================
    logger.info('\n--- Profile Collection ---');

    // Missing: email + deletedAt for soft delete queries
    await db.collection('profiles').createIndex(
      { email: 1, deletedAt: 1 },
      { name: 'idx_profile_email_deleted', sparse: true }
    );
    logger.info('✓ Created: idx_profile_email_deleted');

    // Missing: phone + deletedAt for soft delete queries
    await db.collection('profiles').createIndex(
      { phone: 1, deletedAt: 1 },
      { name: 'idx_profile_phone_deleted', sparse: true }
    );
    logger.info('✓ Created: idx_profile_phone_deleted');

    // Missing: createdAt for timeline queries
    await db.collection('profiles').createIndex(
      { createdAt: -1 },
      { name: 'idx_profile_created' }
    );
    logger.info('✓ Created: idx_profile_created');

    // ========================================
    // ADDRESS COLLECTION INDEXES
    // ========================================
    logger.info('\n--- Address Collection ---');

    // Missing: userId + isDefault for default address lookup
    await db.collection('addresses').createIndex(
      { userId: 1, isDefault: -1 },
      { name: 'idx_address_user_default' }
    );
    logger.info('✓ Created: idx_address_user_default');

    // ========================================
    // MULTI-PERSONA PROFILE INDEXES
    // ========================================
    logger.info('\n--- Multi-Persona Profile Collection ---');

    // Missing: soft delete support
    await db.collection('multi_persona_profiles').createIndex(
      { userId: 1, deletedAt: 1 },
      { name: 'idx_mpp_user_deleted', sparse: true }
    );
    logger.info('✓ Created: idx_mpp_user_deleted');

    // Missing: createdAt for audit queries
    await db.collection('multi_persona_profiles').createIndex(
      { createdAt: -1 },
      { name: 'idx_mpp_created' }
    );
    logger.info('✓ Created: idx_mpp_created');

    // ========================================
    // CREATOR PROFILE INDEXES
    // ========================================
    logger.info('\n--- Creator Profile Collection ---');

    // Missing: tier + status + createdAt for listing
    await db.collection('creatorprofiles').createIndex(
      { tier: 1, status: 1, createdAt: -1 },
      { name: 'idx_creator_tier_status_date' }
    );
    logger.info('✓ Created: idx_creator_tier_status_date');

    logger.info('\n========================================');
    logger.info('Migration completed successfully!');
    logger.info('========================================\n');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

migrate()
  .then(() => {
    logger.info('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });

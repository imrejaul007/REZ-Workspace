/**
 * Savings Module - MongoDB Indexes
 *
 * Critical for query performance on large datasets.
 * Run this script after deploying to create indexes.
 *
 * Usage:
 *   npx ts-node src/models/savingsIndexes.ts
 *   OR import this module to auto-create indexes on startup
 */

import mongoose from 'mongoose';
import { SavingsEntry, SavingsGoal, SavingsStreak, SavingsInsight, SavingsProjection, UserSavingsSummary } from './Savings';
import { logger } from '../config/logger';

/**
 * Create all indexes for savings collections
 */
export async function createSavingsIndexes(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not connected');
  }

  logger.info('[SavingsIndexes] Creating indexes...');

  try {
    // ─── SavingsEntry Indexes ─────────────────────────────────────────────────

    await db.collection('savingsentries').createIndexes([
      // Primary lookup index
      { key: { userId: 1, createdAt: -1 }, name: 'idx_userId_createdAt' },

      // Type filtering
      { key: { userId: 1, type: 1, createdAt: -1 }, name: 'idx_userId_type_createdAt' },

      // Category filtering
      { key: { userId: 1, category: 1, createdAt: -1 }, name: 'idx_userId_category_createdAt' },

      // Unique entry lookup
      { key: { entryId: 1 }, name: 'idx_entryId', unique: true },

      // Aggregation support
      { key: { createdAt: -1 }, name: 'idx_createdAt' },
      { key: { type: 1, createdAt: -1 }, name: 'idx_type_createdAt' },
      { key: { category: 1, createdAt: -1 }, name: 'idx_category_createdAt' },

      // TTL index for data retention (optional - uncomment if needed)
      // { key: { createdAt: 1 }, expireAfterSeconds: 365 * 24 * 60 * 60, name: 'idx_ttl_365d' },
    ]);

    logger.info('[SavingsIndexes] SavingsEntry indexes created');

    // ─── SavingsGoal Indexes ─────────────────────────────────────────────────

    await db.collection('savingsgoals').createIndexes([
      // Primary lookup
      { key: { userId: 1, goalId: 1 }, name: 'idx_userId_goalId', unique: true },

      // Active goals lookup
      { key: { userId: 1, isCompleted: 1 }, name: 'idx_userId_isCompleted' },

      // User lookup
      { key: { userId: 1, createdAt: -1 }, name: 'idx_userId_createdAt' },

      // Goal completion tracking
      { key: { isCompleted: 1, completedAt: -1 }, name: 'idx_isCompleted_completedAt' },
    ]);

    logger.info('[SavingsIndexes] SavingsGoal indexes created');

    // ─── SavingsStreak Indexes ───────────────────────────────────────────────

    await db.collection('savingsstreakschemas').createIndexes([
      // User lookup (unique)
      { key: { userId: 1 }, name: 'idx_userId', unique: true },

      // Active streak leaderboard
      { key: { currentStreak: -1, streakActive: 1 }, name: 'idx_currentStreak_active' },

      // Longest streak leaderboard
      { key: { longestStreak: -1 }, name: 'idx_longestStreak' },
    ]);

    logger.info('[SavingsIndexes] SavingsStreak indexes created');

    // ─── SavingsInsight Indexes ─────────────────────────────────────────────

    await db.collection('savingsinsights').createIndexes([
      // User lookup
      { key: { userId: 1, insightType: 1 }, name: 'idx_userId_insightType' },

      // Unique per user per type
      { key: { userId: 1, insightType: 1 }, name: 'idx_userId_insightType_unique', unique: true },

      // Recent insights
      { key: { userId: 1, updatedAt: -1 }, name: 'idx_userId_updatedAt' },
    ]);

    logger.info('[SavingsIndexes] SavingsInsight indexes created');

    // ─── SavingsProjection Indexes ──────────────────────────────────────────

    await db.collection('savingsprojections').createIndexes([
      // User lookup (unique)
      { key: { userId: 1 }, name: 'idx_userId', unique: true },

      // Projection calculations
      { key: { monthlyAverage: -1 }, name: 'idx_monthlyAverage' },
      { key: { trendDirection: 1, calculatedAt: -1 }, name: 'idx_trendDirection_calculatedAt' },
    ]);

    logger.info('[SavingsIndexes] SavingsProjection indexes created');

    // ─── UserSavingsSummary Indexes ────────────────────────────────────────

    await db.collection('usersavingssummaries').createIndexes([
      // User lookup (unique)
      { key: { userId: 1 }, name: 'idx_userId', unique: true },

      // Top savers leaderboard
      { key: { totalSavings: -1 }, name: 'idx_totalSavings' },

      // Monthly aggregations
      { key: { thisMonth: -1 }, name: 'idx_thisMonth' },

      // Transaction count
      { key: { transactionCount: -1 }, name: 'idx_transactionCount' },
    ]);

    logger.info('[SavingsIndexes] UserSavingsSummary indexes created');

    // ─── AML Alerts Indexes ────────────────────────────────────────────────

    await db.collection('aml_alerts').createIndexes([
      // User lookup
      { key: { userId: 1, createdAt: -1 }, name: 'idx_userId_createdAt' },

      // Status tracking
      { key: { status: 1, createdAt: -1 }, name: 'idx_status_createdAt' },

      // Severity filtering
      { key: { severity: 1, createdAt: -1 }, name: 'idx_severity_createdAt' },

      // Alert type
      { key: { type: 1, createdAt: -1 }, name: 'idx_type_createdAt' },
    ]);

    logger.info('[SavingsIndexes] AML alerts indexes created');

    logger.info('[SavingsIndexes] All indexes created successfully!');
  } catch (error) {
    logger.error('[SavingsIndexes] Failed to create indexes', { error });
    throw error;
  }
}

/**
 * Drop all savings indexes (use with caution!)
 */
export async function dropSavingsIndexes(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not connected');
  }

  logger.warn('[SavingsIndexes] Dropping all indexes...');

  const collections = [
    'savingsentries',
    'savingsgoals',
    'savingsstreakschemas',
    'savingsinsights',
    'savingsprojections',
    'usersavingssummaries',
    'aml_alerts',
  ];

  for (const collection of collections) {
    try {
      await db.collection(collection).dropIndexes();
      logger.info(`[SavingsIndexes] Dropped indexes for ${collection}`);
    } catch (error) {
      if (error.codeName !== 'IndexNotFound') {
        logger.error(`[SavingsIndexes] Failed to drop indexes for ${collection}`, { error });
      }
    }
  }

  logger.info('[SavingsIndexes] All indexes dropped');
}

/**
 * List all indexes for savings collections
 */
export async function listSavingsIndexes(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not connected');
  }

  const collections = [
    'savingsentries',
    'savingsgoals',
    'savingsstreakschemas',
    'savingsinsights',
    'savingsprojections',
    'usersavingssummaries',
    'aml_alerts',
  ];

  for (const collection of collections) {
    try {
      const indexes = await db.collection(collection).indexes();
      logger.info(`[SavingsIndexes] ${collection}:`, indexes.map(i => i.name));
    } catch (error) {
      logger.error(`[SavingsIndexes] Failed to list indexes for ${collection}`, { error });
    }
  }
}

// Auto-create indexes on import (optional)
if (process.env.AUTO_CREATE_INDEXES === 'true') {
  createSavingsIndexes()
    .then(() => logger.info('[SavingsIndexes] Auto-creation complete'))
    .catch((err) => logger.error('[SavingsIndexes] Auto-creation failed', { error: err }));
}

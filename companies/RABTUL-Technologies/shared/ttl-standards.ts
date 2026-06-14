import logger from '../config/logger';

/**
 * TTL Standards Migration
 *
 * Standardizes TTL (Time-To-Live) values across all services.
 * This ensures consistent data retention policies.
 *
 * Run with: npx ts-node src/migrations/002_standardize_ttl.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/admin';

/**
 * TTL Standards by Data Category
 */
export const TTL_STANDARDS = {
  // Short-term: 7 days
  SESSION_DATA: 7 * 24 * 60 * 60, // 7 days

  // Medium-term: 30 days
  RECENT_TRANSACTIONS: 30 * 24 * 60 * 60, // 30 days
  AUDIT_LOGS: 30 * 24 * 60 * 60, // 30 days
  CACHE_DATA: 30 * 24 * 60 * 60, // 30 days

  // Long-term: 90 days
  PAYMENT_RECONCILIATION: 90 * 24 * 60 * 60, // 90 days
  ORDER_HISTORY: 90 * 24 * 60 * 60, // 90 days

  // Extended: 1 year
  FINANCIAL_RECORDS: 365 * 24 * 60 * 60, // 1 year
  TAX_RECORDS: 365 * 24 * 60 * 60, // 1 year

  // Multi-year: 3 years
  USER_HISTORY: 3 * 365 * 24 * 60 * 60, // 3 years
  ANALYTICS_DATA: 3 * 365 * 24 * 60 * 60, // 3 years

  // Extended: 5 years (for compliance)
  CONTRACT_RECORDS: 5 * 365 * 24 * 60 * 60, // 5 years
  AUDIT_COMPLETE: 5 * 365 * 24 * 60 * 60, // 5 years

  // Very Long: 7 years (regulatory)
  COMPLIANCE_DATA: 7 * 365 * 24 * 60 * 60, // 7 years
  TAX_COMPLIANCE: 7 * 365 * 24 * 60 * 60, // 7 years
};

/**
 * Collection-specific TTL policies
 */
export const COLLECTION_TTL_POLICIES = [
  // RABTUL Core Services
  {
    collection: 'refreshtokens',
    field: 'expiresAt',
    ttlSeconds: TTL_STANDARDS.SESSION_DATA,
    description: 'Refresh tokens expire in 7 days',
  },
  {
    collection: 'sessions',
    field: 'expiresAt',
    ttlSeconds: TTL_STANDARDS.SESSION_DATA,
    description: 'Sessions expire in 7 days',
  },
  {
    collection: 'paymentauditlogs',
    field: 'createdAt',
    ttlSeconds: TTL_STANDARDS.FINANCIAL_RECORDS,
    description: 'Payment audit logs retained for 1 year',
  },
  {
    collection: 'auditlogs',
    field: 'timestamp',
    ttlSeconds: TTL_STANDARDS.AUDIT_COMPLETE,
    description: 'Audit logs retained for 5 years',
  },

  // Order Service
  {
    collection: 'orders',
    field: 'createdAt',
    ttlSeconds: TTL_STANDARDS.ORDER_HISTORY,
    description: 'Orders retained for 90 days (configurable)',
    note: 'This should be configurable per tenant',
  },

  // Wallet Service
  {
    collection: 'ledgerentries',
    field: 'createdAt',
    ttlSeconds: TTL_STANDARDS.FINANCIAL_RECORDS,
    description: 'Ledger entries retained for 1 year',
  },
  {
    collection: 'wallettransactions',
    field: 'createdAt',
    ttlSeconds: TTL_STANDARDS.FINANCIAL_RECORDS,
    description: 'Wallet transactions retained for 1 year',
  },

  // StayOwn / Hotel Channel Bridge
  {
    collection: 'sync_jobs',
    field: 'createdAt',
    ttlSeconds: TTL_STANDARDS.RECENT_TRANSACTIONS,
    description: 'Sync jobs retained for 30 days',
    oldValue: 90 * 24 * 60 * 60, // Was 90 days
  },
  {
    collection: 'inventory',
    field: 'date',
    ttlSeconds: undefined, // No TTL - keep inventory for reporting
    description: 'Inventory dates auto-deleted by date field (2 years)',
    action: 'REMOVE_TTL', // Some collections should NOT have TTL
  },
  {
    collection: 'pricing',
    field: 'date',
    ttlSeconds: undefined,
    description: 'Pricing dates should be kept for analysis',
    action: 'REMOVE_TTL',
  },

  // DLQ / Event Processing
  {
    collection: 'dlqentries',
    field: 'createdAt',
    ttlSeconds: TTL_STANDARDS.RECENT_TRANSACTIONS,
    description: 'DLQ entries retained for 30 days',
  },

  // Cache / Temporary Data
  {
    collection: 'rate_limits',
    field: 'createdAt',
    ttlSeconds: TTL_STANDARDS.SESSION_DATA,
    description: 'Rate limit data expires in 7 days',
  },
];

/**
 * Collections that should NEVER have TTL
 */
export const NO_TTL_COLLECTIONS = [
  'users', // User data - never delete
  'profiles', // Profile data - never delete
  'wallets', // Wallet balance - never delete
  'merchants', // Merchant data - never delete
  'products', // Product catalog - never delete
  'categories', // Category data - never delete
  'inventory', // Keep for historical analysis (controlled by date field)
  'pricing', // Keep for pricing analysis
  'bookings', // Hotel bookings - compliance requirement
  'payments', // Payment records - compliance requirement
];

async function migrate() {
  logger.info('Starting TTL standardization migration...');
  logger.info(`Connecting to: ${MONGODB_URI}`);

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('Failed to connect to database');
  }

  const results: Array<{ collection: string; action: string; result: string }> = [];

  for (const policy of COLLECTION_TTL_POLICIES) {
    try {
      const collection = db.collection(policy.collection);

      // Check if collection exists
      const collections = await db.listCollections({ name: policy.collection }).toArray();
      if (collections.length === 0) {
        logger.info(`⚠ Collection ${policy.collection} does not exist, skipping`);
        results.push({
          collection: policy.collection,
          action: 'SKIPPED',
          result: 'Collection not found',
        });
        continue;
      }

      // Get existing indexes
      const indexes = await collection.indexes();
      const ttlIndex = indexes.find(idx =>
        idx.key && Object.values(idx.key).includes(1) &&
        idx.key[policy.field] === 1 &&
        idx.expireAfterSeconds !== undefined
      );

      if (policy.action === 'REMOVE_TTL' || policy.ttlSeconds === undefined) {
        // Remove TTL index
        if (ttlIndex) {
          await collection.dropIndex(ttlIndex.name);
          logger.info(`✓ Removed TTL from ${policy.collection}.${policy.field}`);
          results.push({
            collection: policy.collection,
            action: 'REMOVE_TTL',
            result: `Removed TTL index (was ${ttlIndex.expireAfterSeconds}s)`,
          });
        } else {
          logger.info(`- No TTL to remove from ${policy.collection}`);
          results.push({
            collection: policy.collection,
            action: 'NO_CHANGE',
            result: 'No TTL index found',
          });
        }
      } else {
        // Create or update TTL index
        if (ttlIndex) {
          // Update existing TTL
          await collection.dropIndex(ttlIndex.name);
        }

        await collection.createIndex(
          { [policy.field]: 1 },
          {
            expireAfterSeconds: policy.ttlSeconds,
            name: `ttl_${policy.field}`,
          }
        );

        const oldValueStr = policy.oldValue
          ? ` (was ${Math.round(policy.oldValue / 86400)} days)`
          : '';

        console.log(
          `✓ Set TTL on ${policy.collection}.${policy.field} = ${Math.round(policy.ttlSeconds / 86400)} days${oldValueStr}`
        );

        results.push({
          collection: policy.collection,
          action: 'SET_TTL',
          result: `Set TTL to ${Math.round(policy.ttlSeconds / 86400)} days`,
        });
      }
    } catch (error) {
      logger.error(`Error processing ${policy.collection}:`, error.message);
      results.push({
        collection: policy.collection,
        action: 'ERROR',
        result: error.message,
      });
    }
  }

  // Summary
  logger.info('\n========================================');
  logger.info('Migration Summary');
  logger.info('========================================');
  logger.info(`Total collections processed: ${COLLECTION_TTL_POLICIES.length}`);
  logger.info(`Successful: ${results.filter(r => r.action === 'SET_TTL' || r.action === 'REMOVE_TTL').length}`);
  logger.info(`Skipped: ${results.filter(r => r.action === 'SKIPPED').length}`);
  logger.info(`Errors: ${results.filter(r => r.action === 'ERROR').length}`);

  logger.info('\nDetails:');
  for (const r of results) {
    const icon = r.action === 'ERROR' ? '✗' : r.action === 'SKIPPED' ? '-' : '✓';
    logger.info(`  ${icon} ${r.collection}: ${r.action} - ${r.result}`);
  }

  await mongoose.disconnect();
  logger.info('\nDisconnected from MongoDB');
}

// Run migration
migrate()
  .then(() => {
    logger.info('\nMigration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

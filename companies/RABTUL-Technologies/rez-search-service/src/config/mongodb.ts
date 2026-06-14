import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez';
  const isProduction = process.env.NODE_ENV === 'production';

  await mongoose.connect(uri, {
    // IDX-1: Disable autoIndex in production (same pattern as monolith).
    // autoIndex=true would make every pod re-run ensureIndex() on boot,
    // stalling startup and racing on large collections. Index creation
    // is handled via one-off migration scripts in production.
    autoIndex: !isProduction,
    autoCreate: !isProduction,
    maxPoolSize: 20,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    socketTimeoutMS: 45000,
    // SECURITY FIX: Enforce TLS in production
    ...(isProduction && {
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    }),
  });
  await verifyIndexes();
  logger.info('[MongoDB] Connected' + (isProduction ? ' (TLS enabled)' : ''));
}

/**
 * SEA-013 FIX: Verify required indexes exist at startup.
 *
 * Indexes required by this service:
 * - stores: 2dsphere index on 'location'  ($geoNear queries in searchService + homepageService)
 * - stores: text index on 'name' + 'categories.name' ($text search in searchService)
 * - stores: compound index on 'isActive' + 'cashbackRate' (sort by cashbackRate in homepageService)
 * - storepayments: index on 'createdAt' + 'status' ($match on recent completed orders in recommendationService + homepageService)
 * - storepayments: index on 'storeId' ($group by storeId in recommendationService + homepageService)
 * - storevisits: index on 'userId' + 'createdAt' (recent visits in homepageService)
 * - userstreaks: index on 'userId' + 'type' + 'updatedAt' (trending by category in searchService)
 *
 * NOTE: Index creation is idempotent — createIndex is a no-op if the index already exists.
 * Indexes should be created by the data owner service (rez-backend); this service verifies
 * and creates them only as a safety net for local dev / fresh environments.
 */
async function verifyIndexes(): Promise<void> {
  // Index spec objects: Record<string, 1 | -1 | 'text' | '2dsphere' | 'text'>.
  const requiredIndexes: Array<{ coll: string; spec: Record<string, 1 | -1 | 'text' | '2dsphere'>; reason: string }> = [
    {
      coll: 'stores',
      spec: { location: '2dsphere' },
      reason: '$geoNear queries in searchService and homepageService',
    },
    {
      coll: 'stores',
      spec: { name: 'text', 'categories.name': 'text' },
      reason: '$text search in searchService',
    },
    // SECURITY FIX: Missing compound index for cashback sorting
    {
      coll: 'stores',
      spec: { isActive: 1, cashbackRate: -1 },
      reason: '$sort by cashbackRate in homepageService getHomeFeed()',
    },
    {
      coll: 'storepayments',
      spec: { createdAt: 1, status: 1 },
      reason: '$match on recent completed orders in recommendationService + homepageService',
    },
    {
      coll: 'storepayments',
      spec: { storeId: 1 },
      reason: '$group by storeId in trending aggregation',
    },
    {
      coll: 'storevisits',
      spec: { userId: 1, createdAt: -1 },
      reason: 'recent visits in homepageService',
    },
    {
      coll: 'userstreaks',
      spec: { userId: 1, type: 1, updatedAt: -1 },
      reason: 'trending by category in searchService',
    },
  ];

  for (const { coll, spec, reason } of requiredIndexes) {
    try {
      const collection = mongoose.connection.collection(coll);
      await collection.createIndex(spec, { background: true });
      logger.debug(`[MongoDB] Index verified/created on '${coll}': ${JSON.stringify(spec)} (${reason})`);
    } catch (err) {
      // Log but don't fail startup — missing index degrades performance, not correctness.
      logger.warn(`[MongoDB] Could not verify/create index on '${coll}': ${(err as Error).message}`);
    }
  }
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
}

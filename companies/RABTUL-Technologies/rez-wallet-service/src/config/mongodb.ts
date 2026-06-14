import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('[FATAL] MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => logger.info('[MongoDB] Connected'));
  mongoose.connection.on('disconnected', () => logger.warn('[MongoDB] Disconnected'));
  mongoose.connection.on('error', (err) => logger.error('[MongoDB] Error: ' + err.message));

  await mongoose.connect(uri, {
    // IDX-1: Disable autoIndex in production (same pattern as monolith).
    // autoIndex=true would make every pod re-run ensureIndex() on boot,
    // stalling startup and racing on large collections. Index creation
    // is handled via one-off migration scripts in production.
    autoIndex: process.env.NODE_ENV !== 'production',
    autoCreate: process.env.NODE_ENV !== 'production',
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    w: 'majority',
    journal: true,
  });

  // L9 FIX: Guard index creation to non-production only.
  // In production, run index migrations as one-off scripts, not on every startup.
  const db = mongoose.connection.db;
  if (db && process.env.NODE_ENV !== 'production') {
    db.collection('merchantpayouts').createIndex({ merchantId: 1, requestedAt: -1 }, { background: true }).catch((err) => logger.error('[MongoDB] Failed to create merchantId+requestedAt index', { error: err?.message }));
    db.collection('merchantpayouts').createIndex({ status: 1, requestedAt: 1 }, { background: true }).catch((err) => logger.error('[MongoDB] Failed to create status+requestedAt index', { error: err?.message }));
  }
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
}

import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectMongoDB(): Promise<void> {
  // SECURITY FIX: Fail at startup instead of silently falling back
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  mongoose.set('strictQuery', false);

  mongoose.connection.on('connected', () => logger.info('[MongoDB] Connected'));
  mongoose.connection.on('disconnected', () => logger.warn('[MongoDB] Disconnected'));
  mongoose.connection.on('error', (err) => logger.error('[MongoDB] Error: ' + err.message));

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri, {
        // M4 FIX: Disable autoIndex in production to prevent every pod from
        // re-running ensureIndex() on boot, which stalls startup and races
        // on large collections.
        autoIndex: process.env.NODE_ENV !== 'production',
        autoCreate: process.env.NODE_ENV !== 'production',
        // M14 FIX: Increase pool size from 10 to 50 for better concurrency.
        // With 10 connections and poolTimeoutMS=10s, under load you get:
        // "MongooseServerSelectionError: connection timeout" when all 10 are busy.
        maxPoolSize: 50,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      return;
    } catch (err) {
      logger.error(`[MongoDB] Connection attempt ${attempt}/${MAX_RETRIES} failed:`, err);
      if (attempt === MAX_RETRIES) {
        throw err;
      }
      logger.info(`[MongoDB] Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
}

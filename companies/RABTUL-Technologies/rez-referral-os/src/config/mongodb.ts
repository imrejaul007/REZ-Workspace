import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { validateEnv } from './env';

export async function connectMongoDB(): Promise<void> {
  const env = validateEnv();
  const uri = env.MONGODB_URI;

  if (!uri) {
    logger.error('[FATAL] MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    logger.info('[MongoDB] Connected to database');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('[MongoDB] Disconnected from database');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('[MongoDB] Connection error: ' + err.message);
  });

  try {
    await mongoose.connect(uri, {
      autoIndex: env.NODE_ENV !== 'production',
      autoCreate: env.NODE_ENV !== 'production',
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
    logger.info(`[MongoDB] Successfully connected to ${uri}`);
  } catch (error) {
    logger.error('[MongoDB] Failed to connect: ' + (error as Error).message);
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('[MongoDB] Disconnected');
}

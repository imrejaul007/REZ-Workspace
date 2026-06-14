/**
 * MongoDB Connection
 */
import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('[MongoDB] MONGODB_URI not set');

  mongoose.connection.on('connected', () => logger.info('[MongoDB] Connected'));
  mongoose.connection.on('disconnected', () => logger.warn('[MongoDB] Disconnected'));
  mongoose.connection.on('error', (err) => logger.error('[MongoDB] Error: ' + err.message));

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });
  logger.info('[MongoDB] Connected successfully');
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('[MongoDB] Disconnected');
}

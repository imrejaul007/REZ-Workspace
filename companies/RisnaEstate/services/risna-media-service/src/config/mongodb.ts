import mongoose from 'mongoose';
import { logger } from './logger';
export async function connectMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) { logger.error('[FATAL] MONGODB_URI not set'); process.exit(1); }
  mongoose.connection.on('connected', () => logger.info('[MongoDB] Connected'));
  mongoose.connection.on('error', (err) => logger.error('[MongoDB] Error: ' + err.message));
  await mongoose.connect(uri, { maxPoolSize: 20, minPoolSize: 5 });
  logger.info('[MongoDB] Connected successfully');
}
export async function disconnectMongoDB(): Promise<void> { await mongoose.disconnect(); }

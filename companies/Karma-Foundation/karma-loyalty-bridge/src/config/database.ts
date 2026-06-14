/**
 * MongoDB Configuration for Karma Loyalty Bridge
 */
import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/karma_loyalty';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('[MongoDB] Connected to database');
  } catch (error) {
    logger.error('[MongoDB] Connection failed', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('[MongoDB] Disconnected');
}

// Simple logger (avoid circular dependency)
const logger = {
  info: (message: string, meta?: object) => console.log(message, meta || ''),
  error: (message: string, meta?: object) => console.error(message, meta || ''),
};

export default mongoose;

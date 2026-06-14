import mongoose from 'mongoose';
import { logger } from './logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intent-signal-aggregator';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected successfully', { uri: MONGODB_URI });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error });
    throw error;
  }
}

export function getConnectionStatus(): string {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}
import mongoose from 'mongoose';
import { logger } from './logger.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intent-prediction-engine';

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set('strictQuery', false);

    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected successfully', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error: (error as Error).message });
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

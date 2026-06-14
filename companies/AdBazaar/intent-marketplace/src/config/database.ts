import mongoose from 'mongoose';
import { logger } from './logger.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intent-marketplace';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
 logger.info('MongoDB connected successfully', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('MongoDB disconnection failed', { error });
    throw error;
  }
}

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error', { error });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

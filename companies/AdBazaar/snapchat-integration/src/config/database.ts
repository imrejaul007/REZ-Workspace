import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from 'utils/logger.js';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('MongoDB connected successfully', { uri: config.mongodb.uri });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err });
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
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

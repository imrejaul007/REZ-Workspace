import mongoose from 'mongoose';
import { config } from './index';
import { logger } from './logger';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB', { uri: config.mongodb.uri });

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
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
}

import mongoose from 'mongoose';
import { config } from './index';
import { logger } from 'utils/logger.js';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};
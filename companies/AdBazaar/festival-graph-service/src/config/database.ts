import mongoose from 'mongoose';
import { config } from './environment.js';
import { logger } from './logger.js';

export async function connectDatabase(): Promise<void> {
  try {
    const { uri, options } = config.mongodb;

    logger.info('Connecting to MongoDB...', { uri: uri.replace(/\/\/.*@/, '//<credentials>@') });

    await mongoose.connect(uri, options);

    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to connect to MongoDB', { error: errorMessage });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error disconnecting from MongoDB', { error: errorMessage });
    throw error;
  }
}

export { mongoose };
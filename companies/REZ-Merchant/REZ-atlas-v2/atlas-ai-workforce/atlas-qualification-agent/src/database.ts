/**
 * REZ Atlas v2 - Database Connection Utility
 * MongoDB connection with retry logic
 */

import mongoose from 'mongoose';
import { logger } from './utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/atlas-qualification-agent';

  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      logger.info('Connecting to MongoDB...', { uri: mongoUri.replace(/\/\/.*@/, '//***@') });

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info('MongoDB connected successfully');

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', { error: err.message });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return;
    } catch (error) {
      retries++;
      const delay = RETRY_DELAY * retries;
      logger.error(`MongoDB connection failed (attempt ${retries}/${MAX_RETRIES})`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        nextRetryIn: delay
      });

      if (retries >= MAX_RETRIES) {
        logger.error('Max retries reached. Exiting...');
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error });
  }
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
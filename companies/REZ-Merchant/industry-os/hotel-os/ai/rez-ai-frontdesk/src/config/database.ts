/**
 * Database configuration and connection for AI Front Desk Service
 */

import mongoose from 'mongoose';
import { config } from './index';
import { logger } from './logger';

let isConnected = false;

export async function connectDatabase(): Promise<boolean> {
  if (isConnected) {
    logger.info('Database already connected');
    return true;
  }

  try {
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info('Connected to MongoDB', { uri: config.mongodb.uri });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    return true;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    return false;
  }
}

export function getConnectionStatus(): boolean {
  return isConnected;
}

export default { connectDatabase, getConnectionStatus };
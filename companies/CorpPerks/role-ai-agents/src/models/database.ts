// ============================================================================
// Role AI Agents - Database Connection
// ============================================================================

import mongoose from 'mongoose';
import config from '../config';
import logger from '../utils/logger';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    logger.info('Using existing database connection');
    return;
  }

  try {
    const { uri, options } = config.mongodb;

    logger.info('Connecting to MongoDB...', { uri: uri.replace(/\/\/.*@/, '//<credentials>@') });

    await mongoose.connect(uri, options);

    isConnected = true;
    logger.info('MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

    // Graceful shutdown
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    throw error;
  }
}

async function gracefulShutdown(): Promise<void> {
  logger.info('Shutting down MongoDB connection...');

  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error during MongoDB shutdown', { error: (error as Error).message });
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Failed to disconnect database', { error: (error as Error).message });
    throw error;
  }
}

export function getConnectionStatus(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

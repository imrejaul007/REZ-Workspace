import mongoose from 'mongoose';
import { logger } from './logger.js';

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

export interface DatabaseConfig {
  uri: string;
  options?: mongoose.ConnectOptions;
}

export async function connectDatabase(config: DatabaseConfig): Promise<void> {
  const { uri, options = {} } = config;

  try {
    await mongoose.connect(uri, {
      ...options,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info('MongoDB connected', { uri });

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
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('MongoDB disconnect error', { error });
    throw error;
  }
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export default {
  connect: connectDatabase,
  disconnect: disconnectDatabase,
  isConnected,
};

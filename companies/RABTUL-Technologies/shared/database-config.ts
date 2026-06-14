import logger from '../config/logger';

/**
 * Shared Database Configuration
 *
 * Standardized MongoDB connection settings for all REZ services.
 * Use this config to ensure consistent connection pooling, timeouts, and behavior.
 *
 * Usage:
 *   import { createDatabaseConnection } from '@rez/shared/database-config';
 *   await createDatabaseConnection(process.env.MONGODB_URI);
 */

import mongoose, { ConnectionOptions } from 'mongoose';

/**
 * Standard database configuration for all services
 */
export const DATABASE_CONFIG: Required<ConnectionOptions> = {
  // Connection pool
  maxPoolSize: 50,
  minPoolSize: 10,

  // Timeouts
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,

  // Heartbeat for replica set detection
  heartbeatFrequencyMS: 10000,

  // Retry behavior
  retryWrites: true,
  retryReads: true,

  // Write concern
  w: 'majority',
  j: true, // Journal write concern

  // Direct connection (for specific use cases)
  directConnection: false,
};

/**
 * Lightweight config for services with lower concurrency
 */
export const DATABASE_CONFIG_LIGHT: Required<ConnectionOptions> = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  j: true,
  directConnection: false,
};

/**
 * Create a database connection with standardized settings
 */
export async function createDatabaseConnection(
  uri: string,
  options: Partial<ConnectionOptions> = {},
  config: Required<ConnectionOptions> = DATABASE_CONFIG
): Promise<typeof mongoose> {
  // Validate URI
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  // Remove credentials from URI for logging
  const safeUri = uri.replace(/\/\/.*@/, '//<credentials>@');

  logger.info(`[Database] Connecting to MongoDB: ${safeUri}`);

  const finalOptions = {
    ...config,
    ...options,
  };

  try {
    const connection = await mongoose.connect(uri, finalOptions);

    // Set up event handlers
    mongoose.connection.on('error', (err) => {
      console.error('[Database] Connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('[Database] Disconnected from MongoDB');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('[Database] Reconnected to MongoDB');
    });

    mongoose.connection.on('open', () => {
      logger.info('[Database] MongoDB connection established');
    });

    console.log('[Database] Connection configured with:', {
      maxPoolSize: finalOptions.maxPoolSize,
      minPoolSize: finalOptions.minPoolSize,
      w: finalOptions.w,
      retryWrites: finalOptions.retryWrites,
    });

    return connection;
  } catch (error) {
    console.error('[Database] Failed to connect:', error);
    throw error;
  }
}

/**
 * Gracefully disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('[Database] Disconnected from MongoDB');
  } catch (error) {
    console.error('[Database] Error during disconnect:', error);
    throw error;
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  isConnected: boolean;
  readyState: number;
  responseTime?: number;
}> {
  const startTime = Date.now();

  try {
    await mongoose.connection.db?.admin().ping();
    const responseTime = Date.now() - startTime;

    return {
      isHealthy: true,
      isConnected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      responseTime,
    };
  } catch (error) {
    return {
      isHealthy: false,
      isConnected: mongoose.connection.readyState !== 1,
      readyState: mongoose.connection.readyState,
    };
  }
}

/**
 * Reconnect with exponential backoff
 */
export async function reconnectWithBackoff(
  uri: string,
  maxRetries: number = 5,
  baseDelayMs: number = 1000
): Promise<void> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await createDatabaseConnection(uri);
      return;
    } catch (error) {
      retries++;
      const delay = baseDelayMs * Math.pow(2, retries);

      logger.info(`[Database] Reconnect attempt ${retries}/${maxRetries} failed. Retrying in ${delay}ms...`);

      if (retries >= maxRetries) {
        throw new Error(`Failed to reconnect after ${maxRetries} attempts`);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

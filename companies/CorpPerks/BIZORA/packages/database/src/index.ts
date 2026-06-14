/**
 * BIZORA Database Package
 * MongoDB Connection + Models
 */

import mongoose from 'mongoose';

// ============================================================================
// Connection
// ============================================================================

export interface DbConfig {
  uri: string;
  options?: mongoose.ConnectionOptions;
}

let connection: typeof mongoose | null = null;

export async function connect(config: DbConfig): Promise<typeof mongoose> {
  if (connection) {
    return connection;
  }

  try {
    const { uri, options = {} } = config;

    connection = await mongoose.connect(uri, {
      ...options,
      // Default options
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('[Database] Connected to MongoDB');

    mongoose.connection.on('error', (err) => {
      logger.error('[Database] Connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('[Database] Disconnected from MongoDB');
    });

    return connection;
  } catch (error) {
    logger.error('[Database] Failed to connect:', error);
    throw error;
  }
}

export async function disconnect(): Promise<void> {
  if (connection) {
    await mongoose.disconnect();
    connection = null;
    logger.info('[Database] Disconnected');
  }
}

export function getConnection(): typeof mongoose | null {
  return connection;
}

export default { connect, disconnect, getConnection };

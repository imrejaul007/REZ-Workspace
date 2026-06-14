import mongoose, { Connection } from 'mongoose';
import { createLogger } from './logger';

const logger = createLogger({ serviceName: 'database' });

export interface DatabaseOptions {
  mongoUrl: string;
  serviceName: string;
  options?: mongoose.ConnectOptions;
  onConnected?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Create MongoDB connection with standard configuration
 */
export async function createDatabaseConnection(options: DatabaseOptions): Promise<Connection> {
  const {
    mongoUrl,
    serviceName,
    options: connectOptions = {},
    onConnected,
    onError,
  } = options;

  const defaultOptions: mongoose.ConnectOptions = {
    maxPoolSize: 20,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    ...connectOptions,
  };

  return new Promise((resolve, reject) => {
    mongoose.connect(mongoUrl, defaultOptions)
      .then((connection) => {
        logger.info(`[${serviceName}] Connected to MongoDB`);

        connection.connection.on('error', (err) => {
          logger.error(`[${serviceName}] MongoDB connection error:`, err);
          onError?.(err);
        });

        connection.connection.on('disconnected', () => {
          logger.warn(`[${serviceName}] MongoDB disconnected`);
        });

        connection.connection.on('reconnected', () => {
          logger.info(`[${serviceName}] MongoDB reconnected`);
        });

        onConnected?.();
        resolve(connection.connection);
      })
      .catch((err) => {
        logger.error(`[${serviceName}] Failed to connect to MongoDB:`, err);
        reject(err);
      });
  });
}

/**
 * Gracefully close database connection
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    throw error;
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Get database connection stats
 */
export function getDatabaseStats(): { readyState: number; host: string; name: string } {
  const state = mongoose.connection;
  return {
    readyState: state.readyState,
    host: state.host,
    name: state.name,
  };
}

export default { createDatabaseConnection, closeDatabaseConnection, isDatabaseConnected, getDatabaseStats };

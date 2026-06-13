import mongoose from 'mongoose';
import { logger } from './logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/property-twin-service';
const MONGODB_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let isConnected = false;

/**
 * Connect to MongoDB
 */
export const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    logger.info('Using existing MongoDB connection');
    return;
  }

  try {
    logger.info('Connecting to MongoDB...', { uri: MONGODB_URI.replace(/\/\/.*@/, '//****@') });

    await mongoose.connect(MONGODB_URI, MONGODB_OPTIONS);

    isConnected = true;
    logger.info('MongoDB connected successfully');

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) {
    logger.info('MongoDB already disconnected');
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

/**
 * Check database connection status
 */
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get database connection info
 */
export const getDatabaseInfo = (): { readyState: number; host: string; name: string } => {
  const conn = mongoose.connection;
  return {
    readyState: conn.readyState,
    host: conn.host || 'unknown',
    name: conn.name || 'unknown',
  };
};

export default {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  getDatabaseInfo,
};

/**
 * MongoDB Database Configuration
 * Production-ready database connection with retry logic
 */

import mongoose from 'mongoose';
import { createLogger } from 'utils/logger.js';

const logger = createLogger('database');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let isConnected = false;

/**
 * Connect to MongoDB with retry logic
 */
export async function connectDB(uri?: string): Promise<void> {
  const mongoUri = uri || process.env.MONGODB_URI || process.env.MONGO_URI ||
    'mongodb://localhost:27017/adbazaar';

  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      logger.info('Connecting to MongoDB...', { uri: mongoUri.replace(/\/\/.*@/, '//<credentials>@') });

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      isConnected = true;
      logger.info('MongoDB connected successfully');

      // Connection event handlers
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', err);
        isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        isConnected = true;
      });

      return;
    } catch (error) {
      retries++;
      logger.error(`MongoDB connection attempt ${retries} failed`, error);

      if (retries >= MAX_RETRIES) {
        logger.error('Max MongoDB connection retries reached');
        throw error;
      }

      logger.info(`Retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Get MongoDB connection status
 */
export function getConnectionStatus(): string {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}

export default { connectDB, disconnectDB, isDatabaseConnected, getConnectionStatus };

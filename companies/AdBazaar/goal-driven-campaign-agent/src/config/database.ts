import mongoose from 'mongoose';
import config from './index.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    logger.info('Using existing database connection');
    return;
  }

  try {
    logger.info('Connecting to MongoDB...', { uri: config.mongodb.uri });

    await mongoose.connect(config.mongodb.uri, config.mongodb.options);

    isConnected = true;
    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err });
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
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error });
    throw error;
  }
}

export function getConnectionStatus(): boolean {
  return isConnected;
}

export default { connectDatabase, disconnectDatabase, getConnectionStatus };

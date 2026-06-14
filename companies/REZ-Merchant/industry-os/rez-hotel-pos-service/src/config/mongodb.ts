import mongoose from 'mongoose';
import { logger } from './logger';

let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) {
    logger.info('[MongoDB] Already connected');
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    logger.info('[MongoDB] Connected successfully', { uri: mongoUri.replace(/\/\/.*@/, '//<credentials>@') });

    mongoose.connection.on('error', (err) => {
      logger.error('[MongoDB] Connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('[MongoDB] Disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('[MongoDB] Reconnected');
    });
  } catch (error) {
    logger.error('[MongoDB] Failed to connect', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('[MongoDB] Disconnected');
  } catch (error) {
    logger.error('[MongoDB] Error during disconnect', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

export function getMongoConnection(): mongoose.Connection {
  return mongoose.connection;
}

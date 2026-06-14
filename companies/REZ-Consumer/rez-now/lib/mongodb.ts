import mongoose from 'mongoose';
import { logger } from './utils/logger';

/**
 * MongoDB connection for rez-now service
 * Uses environment variable MONGODB_URI
 */

let isConnected = false;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.warn('[MongoDB] MONGODB_URI not set, skipping MongoDB connection');
    return;
  }

  mongoose.set('strictQuery', false);

  mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info('[MongoDB] Connected');
  });
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('[MongoDB] Disconnected');
  });
  mongoose.connection.on('error', (err) => logger.error('[MongoDB] Error: ' + err.message));

  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== 'production',
    autoCreate: process.env.NODE_ENV !== 'production',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
  isConnected = false;
}

export function getMongoClient(): typeof mongoose.connection {
  return mongoose.connection;
}

// Database collections accessor
export const loyaltyDb = {
  collection: (name: string) => mongoose.connection.collection(name),
};

export const notificationsDb = {
  collection: (name: string) => mongoose.connection.collection(name),
};

export const usersDb = {
  collection: (name: string) => mongoose.connection.collection(name),
};

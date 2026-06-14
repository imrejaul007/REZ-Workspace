import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intent-attribution';

interface MongoDBConnection {
  isConnected: boolean;
  connection?: typeof mongoose.Connection;
}

const mongoState: MongoDBConnection = {
  isConnected: false
};

export async function connectDatabase(): Promise<void> {
  if (mongoState.isConnected) {
    logger.info('MongoDB already connected');
    return;
  }

  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(MONGODB_URI, options);
    mongoState.isConnected = true;
    mongoState.connection = mongoose.connection;

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
      mongoState.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      mongoState.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      mongoState.isConnected = true;
    });

    logger.info('MongoDB connected successfully', { uri: MONGODB_URI.replace(/\/\/.*@/, '//***@') });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to connect to MongoDB', { error: errorMessage });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!mongoState.isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    mongoState.isConnected = false;
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error disconnecting from MongoDB', { error: errorMessage });
    throw error;
  }
}

export function isDatabaseConnected(): boolean {
  return mongoState.isConnected;
}

export function getDatabaseConnection(): typeof mongoose.Connection | undefined {
  return mongoState.connection;
}

export default {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  getDatabaseConnection
};
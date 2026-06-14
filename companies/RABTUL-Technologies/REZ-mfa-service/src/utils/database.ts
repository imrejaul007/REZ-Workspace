import mongoose from 'mongoose';
import config from '../config';
import logger from './logger';

export async function connectDatabase(): Promise<void> {
  try {
    const options: mongoose.ConnectOptions = {
      maxPoolSize: config.mongodb.options.maxPoolSize,
      serverSelectionTimeoutMS: config.mongodb.options.serverSelectionTimeoutMS,
      socketTimeoutMS: config.mongodb.options.socketTimeoutMS,
    };

    await mongoose.connect(config.mongodb.uri, options);

    logger.info('Connected to MongoDB', {
      host: config.mongodb.uri.split('@')[1] || config.mongodb.uri,
    });

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', {
        error: error.message,
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

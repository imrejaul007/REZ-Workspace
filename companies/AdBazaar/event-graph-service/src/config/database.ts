import mongoose from 'mongoose';
import config from './index.js';
import logger from './logger.js';

const connectionLogger = logger.child({ component: 'Database' });

export const connectDatabase = async (): Promise<void> => {
  const { uri, options } = config.mongodb;

  try {
    connectionLogger.info('Attempting to connect to MongoDB...', {
      host: uri.replace(/\/\/.*@/, '//<credentials>@').split('/')[2] || 'localhost'
    });

    await mongoose.connect(uri, {
      maxPoolSize: options.maxPoolSize,
      minPoolSize: options.minPoolSize,
      serverSelectionTimeoutMS: options.serverSelectionTimeoutMS,
      socketTimeoutMS: options.socketTimeoutMS
    });

    connectionLogger.info('Successfully connected to MongoDB');

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      connectionLogger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      connectionLogger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      connectionLogger.info('MongoDB reconnected');
    });

    // Handle application termination
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

  } catch (error) {
    connectionLogger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

const gracefulShutdown = async () => {
  connectionLogger.info('Initiating graceful shutdown...');

  try {
    await mongoose.connection.close();
    connectionLogger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    connectionLogger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    connectionLogger.info('Disconnected from MongoDB');
  } catch (error) {
    connectionLogger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export default {
  connectDatabase,
  disconnectDatabase,
  isConnected
};
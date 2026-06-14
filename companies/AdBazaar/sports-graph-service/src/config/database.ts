import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const getMongoUri = (): string => {
  const { MONGODB_URI, MONGODB_USER, MONGODB_PASSWORD } = process.env;

  if (MONGODB_URI) {
    return MONGODB_URI;
  }

  const host = process.env.MONGODB_HOST || 'localhost';
  const port = process.env.MONGODB_PORT || '27017';
  const database = process.env.MONGODB_DATABASE || 'sports-graph-service';

  if (MONGODB_USER && MONGODB_PASSWORD) {
    return `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${host}:${port}/${database}?authSource=admin`;
  }

  return `mongodb://${host}:${port}/${database}`;
};

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = getMongoUri();

  try {
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected successfully', { uri: mongoUri.replace(/\/\/.*@/, '//***@') });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    const err = error as Error;
    logger.error('Failed to connect to MongoDB', { error: err.message });
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};

export default { connectDatabase, disconnectDatabase };
/**
 * REZ Atlas v2 - Database Connection Utility
 */

import mongoose from 'mongoose';
import winston from 'winston';

const logFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json());

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'atlas-call-service', version: '2.0.0' },
  transports: [new winston.transports.Console({ format: process.env.NODE_ENV === 'production' ? logFormat : winston.format.combine(winston.format.timestamp(), winston.format.colorize(), winston.format.simpleText()) })],
  exitOnError: false,
});

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/atlas-call-service';
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      logger.info('Connecting to MongoDB...', { uri: mongoUri.replace(/\/\/.*@/, '//***@') });
      await mongoose.connect(mongoUri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
      logger.info('MongoDB connected successfully');
      mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', { error: err.message }));
      mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
      return;
    } catch (error) {
      retries++;
      logger.error(`MongoDB connection failed (attempt ${retries}/${MAX_RETRIES})`, { error: error instanceof Error ? error.message : 'Unknown error' });
      if (retries >= MAX_RETRIES) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error });
  }
}
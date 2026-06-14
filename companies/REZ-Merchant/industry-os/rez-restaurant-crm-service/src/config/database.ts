import logger from './utils/logger';

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-restaurant-crm';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export { MONGODB_URI, REDIS_URL };

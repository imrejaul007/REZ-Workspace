import mongoose from 'mongoose';
import { config } from './index.js';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.database.mongoUri);
    logger.info('Webhook service connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('Webhook service disconnected from MongoDB');
}

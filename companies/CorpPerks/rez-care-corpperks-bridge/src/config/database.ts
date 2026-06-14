import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-care-corpperks-bridge';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to connect to MongoDB:', errorMessage);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error disconnecting from MongoDB:', errorMessage);
  }
}

export function setupGracefulShutdown(): void {
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    await disconnectDatabase();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    await disconnectDatabase();
    process.exit(0);
  });
}

export { mongoose };

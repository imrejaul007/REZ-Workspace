import mongoose from 'mongoose';
import { config } from '../config/index.js';

class DatabaseService {
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await mongoose.connect(config.mongodb.uri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      logger.info('MongoDB connected successfully');

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    await mongoose.disconnect();
    this.isConnected = false;
    logger.info('MongoDB disconnected');
  }

  getConnection(): typeof mongoose.connection {
    return mongoose.connection;
  }

  isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export const databaseService = new DatabaseService();

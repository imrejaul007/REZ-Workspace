import mongoose from 'mongoose';
import { config } from './index';
import { logger } from 'utils/logger.js';

export class Database {
  private static instance: Database;
  private isConnected = false;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      await mongoose.connect(config.mongodb.uri, config.mongodb.options);

      mongoose.connection.on('connected', () => {
        this.isConnected = true;
        logger.info('MongoDB connected successfully');
      });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        this.isConnected = false;
        logger.warn('MongoDB disconnected');
      });

      // Handle graceful shutdown
      process.on('SIGINT', this.gracefulShutdown);
      process.on('SIGTERM', this.gracefulShutdown);

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected gracefully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('Graceful shutdown initiated');
    await this.disconnect();
    process.exit(0);
  }

  getConnection(): typeof mongoose.connection {
    return mongoose.connection;
  }

  isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export const database = Database.getInstance();
export default database;
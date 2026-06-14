import mongoose from 'mongoose';
import config from './index';
import { logger } from '../utils/logger';

export class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('MongoDB: Already connected');
      return;
    }

    try {
      await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      this.isConnected = true;
      logger.info(`MongoDB: Connected to ${config.mongodb.uri}`);

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB: Disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB: Reconnected');
        this.isConnected = true;
      });
    } catch (error) {
      logger.error('MongoDB: Failed to connect', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB: Disconnected');
    } catch (error) {
      logger.error('MongoDB: Error during disconnect', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const db = Database.getInstance();
export default db;

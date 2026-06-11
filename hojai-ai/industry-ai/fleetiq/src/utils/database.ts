/**
 * FLEETIQ - MongoDB Database Connection Manager
 * Production-ready database connection with retry logic
 */

import mongoose from 'mongoose';
import { config } from './config';
import { logger } from './logger';

// Connection state
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;

// ============================================
// CONNECTION OPTIONS
// ============================================

const getConnectionOptions = () => ({
  serverSelectionTimeoutMS: config.mongodb.options.serverSelectionTimeoutMS,
  socketTimeoutMS: config.mongodb.options.socketTimeoutMS,
  maxPoolSize: config.mongodb.options.maxPoolSize,
  family: 4 // Use IPv4
});

// ============================================
// CONNECT
// ============================================

export const connectDatabase = async (): Promise<mongoose.Connection> => {
  if (isConnected) {
    logger.info('Using existing MongoDB connection');
    return mongoose.connection;
  }

  connectionAttempts++;

  try {
    logger.info('Connecting to MongoDB...', {
      uri: config.mongodb.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Hide credentials
      attempt: connectionAttempts
    });

    await mongoose.connect(config.mongodb.uri, getConnectionOptions());

    isConnected = true;
    connectionAttempts = 0;

    logger.info('MongoDB connected successfully', {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      readyState: mongoose.connection.readyState
    });

    // Setup event handlers
    setupConnectionHandlers();

    return mongoose.connection;
  } catch (error) {
    logger.error('MongoDB connection failed', { error, attempt: connectionAttempts });

    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      logger.info(`Retrying connection in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDatabase();
    }

    throw new Error(`Failed to connect to MongoDB after ${MAX_RETRY_ATTEMPTS} attempts`);
  }
};

// ============================================
// CONNECTION HANDLERS
// ============================================

const setupConnectionHandlers = () => {
  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB error', { error: err.message });
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    logger.info('MongoDB reconnected');
  });

  mongoose.connection.on('close', () => {
    isConnected = false;
    logger.info('MongoDB connection closed');
  });
};

// ============================================
// DISCONNECT
// ============================================

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) {
    logger.info('No active MongoDB connection to close');
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { error });
    throw error;
  }
};

// ============================================
// HEALTH CHECK
// ============================================

export const checkDatabaseHealth = async (): Promise<{
  healthy: boolean;
  ready: boolean;
  state: string;
  host?: string;
  collections?: number;
}> => {
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const state = mongoose.connection.readyState;
  const ready = state === 1;

  try {
    if (ready) {
      const collections = await mongoose.connection.db?.collections().then(c => c?.length || 0);
      return {
        healthy: true,
        ready,
        state: stateMap[state] || 'unknown',
        host: mongoose.connection.host,
        collections
      };
    }

    return {
      healthy: false,
      ready,
      state: stateMap[state] || 'unknown'
    };
  } catch {
    return {
      healthy: false,
      ready,
      state: stateMap[state] || 'unknown'
    };
  }
};

// ============================================
// INDEX CREATION
// ============================================

export const createIndexes = async (): Promise<void> => {
  try {
    logger.info('Creating MongoDB indexes...');

    // Vehicle indexes
    const Vehicle = mongoose.model('Vehicle');
    await Vehicle.createIndexes();

    // Driver indexes
    const Driver = mongoose.model('Driver');
    await Driver.createIndexes();

    // Trip indexes
    const Trip = mongoose.model('Trip');
    await Trip.createIndexes();

    // Maintenance indexes
    const Maintenance = mongoose.model('Maintenance');
    await Maintenance.createIndexes();

    logger.info('MongoDB indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes', { error });
  }
};

// ============================================
// SEED DATA
// ============================================

export const seedDefaultData = async (): Promise<void> => {
  try {
    const Vehicle = mongoose.model('Vehicle');
    const Driver = mongoose.model('Driver');

    const vehicleCount = await Vehicle.countDocuments();
    if (vehicleCount === 0) {
      await Vehicle.insertMany([
        {
          registrationNumber: 'MH12AB1234',
          type: 'truck',
          capacity: 5000,
          status: 'available',
          fuelLevel: 85,
          mileage: 45000,
          location: { lat: 19.076, lng: 72.877, address: 'Mumbai, Maharashtra' },
          lastServiceDate: new Date(),
          nextServiceDue: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        },
        {
          registrationNumber: 'MH12CD5678',
          type: 'van',
          capacity: 2000,
          status: 'available',
          fuelLevel: 60,
          mileage: 32000,
          location: { lat: 18.922, lng: 72.833, address: 'Navi Mumbai, Maharashtra' },
          lastServiceDate: new Date(),
          nextServiceDue: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        },
        {
          registrationNumber: 'MH14EF9012',
          type: 'truck',
          capacity: 8000,
          status: 'on-trip',
          fuelLevel: 45,
          mileage: 78000,
          location: { lat: 18.520, lng: 73.856, address: 'Pune, Maharashtra' },
          lastServiceDate: new Date(),
          nextServiceDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ]);
      logger.info('Default vehicles seeded');
    }

    const driverCount = await Driver.countDocuments();
    if (driverCount === 0) {
      await Driver.insertMany([
        {
          name: 'Ramesh Kumar',
          phone: '+919876543210',
          licenseNumber: 'DL-2024001234',
          status: 'available',
          tripsCompleted: 156,
          rating: 4.8,
          totalDistance: 45600,
          totalTrips: 156,
          averageRating: 4.8
        },
        {
          name: 'Suresh Patel',
          phone: '+919876543211',
          licenseNumber: 'DL-2024005678',
          status: 'available',
          tripsCompleted: 89,
          rating: 4.5,
          totalDistance: 28900,
          totalTrips: 89,
          averageRating: 4.5
        },
        {
          name: 'Mohan Singh',
          phone: '+919876543212',
          licenseNumber: 'DL-2024009012',
          status: 'on-trip',
          tripsCompleted: 234,
          rating: 4.9,
          totalDistance: 67800,
          totalTrips: 234,
          averageRating: 4.9
        }
      ]);
      logger.info('Default drivers seeded');
    }
  } catch (error) {
    logger.error('Error seeding default data', { error });
  }
};

export default {
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
  createIndexes,
  seedDefaultData
};